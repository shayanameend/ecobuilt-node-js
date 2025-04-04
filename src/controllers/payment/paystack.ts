import crypto from "crypto";
import type { Request, Response } from "express";

import { env } from "~/lib/env";
import { handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import {
  getBanks,
  initializeTransaction,
  processRefund,
  verifyTransaction,
} from "~/services/payment/paystack";
import {
  initializeTransactionBodySchema,
  processRefundBodySchema,
  verifyTransactionParamsSchema,
} from "~/validators/payment/paystack";

/**
 * Initialize a payment transaction
 */
async function initializePayment(request: Request, response: Response) {
  try {
    const { orderId, callbackUrl } = initializeTransactionBodySchema.parse(
      request.body,
    );

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: request.user.id,
        paymentStatus: "PENDING",
      },
    });

    if (!order) {
      return response.badRequest({}, { message: "Order not found" });
    }

    const { authorizationUrl, reference } = await initializeTransaction({
      order,
      email: request.user.email,
      callbackUrl,
    });

    return response.success(
      {
        data: { authorizationUrl, reference },
      },
      {
        message: "Payment initialized successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

/**
 * Verify a payment transaction
 */
async function verifyPayment(request: Request, response: Response) {
  try {
    const { reference } = verifyTransactionParamsSchema.parse(request.params);

    const { success, order } = await verifyTransaction({ reference });

    return response.success(
      {
        data: { success, order },
      },
      {
        message: "Payment verified successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

/**
 * Process a payment webhook from Paystack
 */
async function handleWebhook(request: Request, response: Response) {
  try {
    // Verify that the request is from Paystack
    const hash = request.headers["x-paystack-signature"];

    // Verify signature
    if (!hash) {
      console.error("No signature in Paystack webhook");
      return response.forbidden({}, { message: "Invalid signature" });
    }

    const payload = JSON.stringify(request.body);
    const secret = env.PAYSTACK_SECRET_KEY;

    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");

    if (computedHash !== hash) {
      console.error("Invalid signature in Paystack webhook");
      return response.forbidden({}, { message: "Invalid signature" });
    }

    const event = request.body;

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await verifyTransaction({ reference: event.data.reference });
        break;

      case "transfer.success":
        // Update payment transfer status
        const payment = await prisma.payment.findFirst({
          where: { paystackTransferReference: event.data.reference },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { transferStatus: "COMPLETED" },
          });
        }
        break;

      case "transfer.failed":
        // Update payment transfer status
        const failedPayment = await prisma.payment.findFirst({
          where: { paystackTransferReference: event.data.reference },
        });

        if (failedPayment) {
          await prisma.payment.update({
            where: { id: failedPayment.id },
            data: { transferStatus: "FAILED" },
          });
        }
        break;
    }

    return response.success({}, { message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return response.success({}, { message: "Webhook processed" });
  }
}

/**
 * Get list of banks supported by Paystack
 */
async function getSupportedBanks(request: Request, response: Response) {
  try {
    const { banks } = await getBanks();

    return response.success(
      {
        data: { banks },
      },
      {
        message: "Banks fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

/**
 * Process a refund for a payment
 */
async function refundPayment(request: Request, response: Response) {
  try {
    const { paymentId, amount } = processRefundBodySchema.parse(request.body);

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
        status: "PAID",
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return response.badRequest({}, { message: "Payment not found" });
    }

    // Only admin can process refunds
    if (request.user.role !== "SUPER_ADMIN" && request.user.role !== "ADMIN") {
      return response.forbidden({}, { message: "Unauthorized" });
    }

    const { success, refundReference } = await processRefund({
      payment,
      amount,
    });

    return response.success(
      {
        data: { success, refundReference },
      },
      {
        message: "Refund processed successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getSupportedBanks,
  refundPayment,
};
