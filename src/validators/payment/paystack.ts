import { z } from "zod";

const initializeTransactionBodySchema = z.object({
  orderId: z.string(),
  callbackUrl: z.string().url(),
});

const verifyTransactionParamsSchema = z.object({
  reference: z.string(),
});

const processRefundBodySchema = z.object({
  paymentId: z.string(),
  amount: z.number().optional(),
});

export {
  initializeTransactionBodySchema,
  verifyTransactionParamsSchema,
  processRefundBodySchema,
};
