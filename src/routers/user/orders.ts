import { Router } from "express";

import {
  createOrder,
  getOrder,
  getOrders,
  toggleOrderStatus,
} from "~/controllers/user/orders";

const ordersRouter = Router();

ordersRouter.get("/", getOrders);

ordersRouter.get("/:id", getOrder);

ordersRouter.post("/", createOrder);

ordersRouter.put("/:id", toggleOrderStatus);

export { ordersRouter };
