import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { vendorSelector } from "~/selectors/vendor";
import { createTransferRecipient, getBanks } from "~/services/payment/paystack";

/**
 * Update vendor bank account details
 */
async function updateBankAccountService({
  userId,
  bankName,
  accountNumber,
  accountName,
  bankCode,
}: {
  userId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      ...vendorSelector.profile,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Vendor not found");
  }

  // Update vendor bank details
  const updatedVendor = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      bankName,
      accountNumber,
      accountName,
    },
    select: {
      ...vendorSelector.profile,
    },
  });

  // Create transfer recipient in Paystack
  await createTransferRecipient({
    vendor: updatedVendor as any,
    bankCode,
  });

  return { vendor: updatedVendor };
}

/**
 * Get vendor bank account details
 */
async function getBankAccountService({ userId }: { userId: string }) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      ...vendorSelector.profile,
      bankName: true,
      accountNumber: true,
      accountName: true,
      paystackRecipientCode: true,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Vendor not found");
  }

  return { vendor };
}

/**
 * Get list of supported banks
 */
async function getSupportedBanksService() {
  const { banks } = await getBanks();
  return { banks };
}

export {
  updateBankAccountService,
  getBankAccountService,
  getSupportedBanksService,
};
