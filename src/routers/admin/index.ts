import { Router } from "express";

import { categoriesRouter } from "~/routers/admin/categories";
import { ordersRouter } from "~/routers/admin/orders";
import { productsRouter } from "~/routers/admin/products";
import { profileRouter } from "~/routers/admin/profile";
import { usersRouter } from "~/routers/admin/users";
import { vendorsRouter } from "~/routers/admin/vendors";

const adminRouter = Router();

adminRouter.use("/categories", categoriesRouter);
adminRouter.use("/orders", ordersRouter);
adminRouter.use("/products", productsRouter);
adminRouter.use("/profile", profileRouter);
adminRouter.use("/users", usersRouter);
adminRouter.use("/vendors", vendorsRouter);

export { adminRouter };
