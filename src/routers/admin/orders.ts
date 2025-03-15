import { Router } from "express";

import {
  getOrder,
  getOrders,
  toggleOrderStatus,
} from "~/controllers/admin/orders";

const ordersRouter = Router();

ordersRouter.get("/", getOrders);

ordersRouter.get("/:id", getOrder);

ordersRouter.put("/:id", toggleOrderStatus);

export { ordersRouter };
