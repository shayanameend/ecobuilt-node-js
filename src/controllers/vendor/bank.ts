import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getBankAccountService,
  getSupportedBanksService,
  updateBankAccountService,
} from "~/services/vendor/bank";
import { updateBankAccountBodySchema } from "~/validators/vendor/bank";

/**
 * Update vendor bank account details
 */
async function updateBankAccount(request: Request, response: Response) {
  try {
    const { bankName, accountNumber, accountName, bankCode } =
      updateBankAccountBodySchema.parse(request.body);

    const { vendor } = await updateBankAccountService({
      userId: request.user.id,
      bankName,
      accountNumber,
      accountName,
      bankCode,
    });

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Bank account updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

/**
 * Get vendor bank account details
 */
async function getBankAccount(request: Request, response: Response) {
  try {
    const { vendor } = await getBankAccountService({
      userId: request.user.id,
    });

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Bank account fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

/**
 * Get list of supported banks
 */
async function getSupportedBanks(request: Request, response: Response) {
  try {
    const { banks } = await getSupportedBanksService();

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

export { updateBankAccount, getBankAccount, getSupportedBanks };
