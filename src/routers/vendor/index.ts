import { Router } from "express";

import { bankRouter } from "~/routers/vendor/bank";
import { categoriesRouter } from "~/routers/vendor/categories";
import { ordersRouter } from "~/routers/vendor/orders";
import { productsRouter } from "~/routers/vendor/products";
import { profileRouter } from "~/routers/vendor/profile";
import { usersRouter } from "~/routers/vendor/users";

const vendorRouter = Router();

vendorRouter.use("/bank", bankRouter);
vendorRouter.use("/categories", categoriesRouter);
vendorRouter.use("/orders", ordersRouter);
vendorRouter.use("/products", productsRouter);
vendorRouter.use("/profile", profileRouter);
vendorRouter.use("/users", usersRouter);

export { vendorRouter };
