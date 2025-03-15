import { Router } from "express";

import { authRouter } from "~/routers/public/auth";
import { categoriesRouter } from "~/routers/public/categories";
import { productsRouter } from "~/routers/public/products";
import { profileRouter } from "~/routers/public/profile";
import { reviewsRouter } from "~/routers/public/reviews";
import { vendorsRouter } from "~/routers/public/vendors";

const publicRouter = Router();

publicRouter.use("/auth", authRouter);
publicRouter.use("/categories", categoriesRouter);
publicRouter.use("/products", productsRouter);
publicRouter.use("/profile", profileRouter);
publicRouter.use("/reviews", reviewsRouter);
publicRouter.use("/vendors", vendorsRouter);

export { publicRouter };
