import type { Order, Payment, Vendor } from "@prisma/client";

import { env } from "~/lib/env";
import { BadResponse } from "~/lib/error";
import { paystackClient } from "~/lib/paystack";
import { prisma } from "~/lib/prisma";

/**
 * Initialize a payment transaction with Paystack
 */
async function initializeTransaction({
  order,
  email,
  callbackUrl,
}: {
  order: Order;
  email: string;
  callbackUrl: string;
}) {
  try {
    const response = await paystackClient.post("/transaction/initialize", {
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      email,
      currency: "ZAR", // South African Rand
      reference: `order_${order.id}_${Date.now()}`,
      callback_url: callbackUrl,
      metadata: {
        orderId: order.id,
        userId: order.userId,
      },
    });

    if (response.data.status) {
      // Update order with payment reference
      await prisma.order.update({
        where: { id: order.id },
        data: { paystackReference: response.data.data.reference },
      });

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    }

    throw new BadResponse("Failed to initialize transaction");
  } catch (error) {
    console.error("Paystack transaction initialization error:", error);
    throw new BadResponse("Failed to initialize transaction");
  }
}

/**
 * Verify a payment transaction with Paystack
 */
async function verifyTransaction({ reference }: { reference: string }) {
  try {
    const response = await paystackClient.get(
      `/transaction/verify/${reference}`,
    );

    if (response.data.status && response.data.data.status === "success") {
      const order = await prisma.order.findFirst({
        where: { paystackReference: reference },
        include: {
          orderToProduct: {
            include: {
              product: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new BadResponse("Order not found");
      }

      // Group products by vendor
      const vendorProducts = new Map<
        string,
        { vendorId: string; amount: number }
      >();

      for (const item of order.orderToProduct) {
        const vendorId = item.product.vendorId;
        const amount = item.price * item.quantity;

        if (vendorProducts.has(vendorId)) {
          const current = vendorProducts.get(vendorId)!;
          vendorProducts.set(vendorId, {
            ...current,
            amount: current.amount + amount,
          });
        } else {
          vendorProducts.set(vendorId, { vendorId, amount });
        }
      }

      // Calculate platform fee and vendor amount for each vendor
      const platformFeePercentage = env.PLATFORM_FEE_PERCENTAGE;

      // Process each vendor's payment
      for (const [vendorId, { amount }] of vendorProducts.entries()) {
        const platformFee = (amount * platformFeePercentage) / 100;
        const vendorAmount = amount - platformFee;

        // Create payment record
        await prisma.payment.create({
          data: {
            amount,
            platformFee,
            vendorAmount,
            paystackReference: `${reference}_${vendorId}`,
            status: "PAID",
            order: { connect: { id: order.id } },
            vendor: { connect: { id: vendorId } },
          },
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "APPROVED",
        },
      });

      return { success: true, order };
    }

    throw new BadResponse("Payment verification failed");
  } catch (error) {
    console.error("Paystack verification error:", error);
    throw new BadResponse("Payment verification failed");
  }
}

/**
 * Create a transfer recipient for a vendor
 */
async function createTransferRecipient({
  vendor,
  bankCode,
}: {
  vendor: Vendor;
  bankCode: string;
}) {
  try {
    if (!vendor.accountNumber || !vendor.accountName) {
      throw new BadResponse("Bank account details are required");
    }

    const response = await paystackClient.post("/transferrecipient", {
      type: "nuban",
      name: vendor.accountName,
      account_number: vendor.accountNumber,
      bank_code: bankCode,
      currency: "ZAR",
    });

    if (response.data.status) {
      // Update vendor with recipient code
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { paystackRecipientCode: response.data.data.recipient_code },
      });

      return { recipientCode: response.data.data.recipient_code };
    }

    throw new BadResponse("Failed to create transfer recipient");
  } catch (error) {
    console.error("Paystack transfer recipient creation error:", error);
    throw new BadResponse("Failed to create transfer recipient");
  }
}

/**
 * Initiate a transfer to a vendor
 */
async function initiateTransfer({
  payment,
  vendor,
}: {
  payment: Payment;
  vendor: Vendor;
}) {
  try {
    if (!vendor.paystackRecipientCode) {
      throw new BadResponse("Vendor has no recipient code");
    }

    const response = await paystackClient.post("/transfer", {
      source: "balance",
      amount: Math.round(payment.vendorAmount * 100), // Convert to cents
      recipient: vendor.paystackRecipientCode,
      currency: "ZAR", // South African Rand
      reason: `Payment for order ${payment.orderId}`,
      reference: `transfer_${payment.id}_${Date.now()}`,
    });

    if (response.data.status) {
      // Update payment with transfer reference
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paystackTransferReference: response.data.data.reference,
          transferStatus: "PROCESSING",
        },
      });

      return { transferReference: response.data.data.reference };
    }

    throw new BadResponse("Failed to initiate transfer");
  } catch (error) {
    console.error("Paystack transfer initiation error:", error);
    throw new BadResponse("Failed to initiate transfer");
  }
}

/**
 * Process a refund for a payment
 */
async function processRefund({
  payment,
  amount,
}: {
  payment: Payment;
  amount?: number;
}) {
  try {
    const refundAmount = amount || payment.amount;

    const response = await paystackClient.post("/refund", {
      transaction: payment.paystackReference,
      amount: Math.round(refundAmount * 100), // Convert to cents
      currency: "ZAR", // South African Rand
    });

    if (response.data.status) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          type: "REFUND",
        },
      });

      // Update order status
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "REFUNDED",
          status: "RETURNED",
        },
      });

      return { success: true, refundReference: response.data.data.reference };
    }

    throw new BadResponse("Failed to process refund");
  } catch (error) {
    console.error("Paystack refund error:", error);
    throw new BadResponse("Failed to process refund");
  }
}

/**
 * Get list of banks supported by Paystack
 */
async function getBanks() {
  try {
    const response = await paystackClient.get("/bank?country=south africa");

    if (response.data.status) {
      return { banks: response.data.data };
    }

    throw new BadResponse("Failed to fetch banks");
  } catch (error) {
    console.error("Paystack banks fetch error:", error);
    throw new BadResponse("Failed to fetch banks");
  }
}

export {
  initializeTransaction,
  verifyTransaction,
  createTransferRecipient,
  initiateTransfer,
  processRefund,
  getBanks,
};
