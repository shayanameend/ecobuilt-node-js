import { Router } from "express";

import { paystackRouter } from "~/routers/payment/paystack";

const paymentRouter = Router();

paymentRouter.use("/paystack", paystackRouter);

export { paymentRouter };
