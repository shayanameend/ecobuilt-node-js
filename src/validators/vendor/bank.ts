import { z } from "zod";

const updateBankAccountBodySchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  bankCode: z.string(),
});

export { updateBankAccountBodySchema };
