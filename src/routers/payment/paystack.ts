import { Router } from "express";

import {
  getSupportedBanks,
  handleWebhook,
  initializePayment,
  refundPayment,
  verifyPayment,
} from "~/controllers/payment/paystack";
import { verifyRequest } from "~/middlewares/auth";

const paystackRouter = Router();

// Public routes
paystackRouter.post("/webhook", handleWebhook);

// User routes
paystackRouter.post(
  "/initialize",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["USER"],
  }),
  initializePayment,
);

paystackRouter.get(
  "/verify/:reference",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
  }),
  verifyPayment,
);

// Vendor routes
paystackRouter.get(
  "/banks",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["VENDOR"],
  }),
  getSupportedBanks,
);

// Admin routes
paystackRouter.post(
  "/refund",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  }),
  refundPayment,
);

export { paystackRouter };
