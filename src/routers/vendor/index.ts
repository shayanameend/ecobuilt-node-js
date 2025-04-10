import { Router } from "express";

import { categoriesRouter } from "~/routers/vendor/categories";
import { dashboardRouter } from "~/routers/vendor/dashboard";
import { ordersRouter } from "~/routers/vendor/orders";
import { productsRouter } from "~/routers/vendor/products";
import { profileRouter } from "~/routers/vendor/profile";
import { usersRouter } from "~/routers/vendor/users";

const vendorRouter = Router();

vendorRouter.use("/dashboard", dashboardRouter);
vendorRouter.use("/categories", categoriesRouter);
vendorRouter.use("/orders", ordersRouter);
vendorRouter.use("/products", productsRouter);
vendorRouter.use("/profile", profileRouter);
vendorRouter.use("/users", usersRouter);

export { vendorRouter };
