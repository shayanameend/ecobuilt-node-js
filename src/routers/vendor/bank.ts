import { Router } from "express";

import {
  getBankAccount,
  getSupportedBanks,
  updateBankAccount,
} from "~/controllers/vendor/bank";

const bankRouter = Router();

bankRouter.get("/", getBankAccount);
bankRouter.put("/", updateBankAccount);
bankRouter.get("/banks", getSupportedBanks);

export { bankRouter };
