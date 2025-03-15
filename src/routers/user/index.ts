import { Router } from "express";

import { ordersRouter } from "~/routers/user/orders";
import { profileRouter } from "~/routers/user/profile";
import { reviewsRouter } from "~/routers/user/reviews";

const userRouter = Router();

userRouter.use("/orders", ordersRouter);
userRouter.use("/profile", profileRouter);
userRouter.use("/reviews", reviewsRouter);

export { userRouter };
