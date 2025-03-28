import { Router } from "express";

import {
  getProduct,
  getProducts,
  toggleProductIsDeleted,
} from "~/controllers/admin/products";

const productsRouter = Router();

productsRouter.get("/", getProducts);

productsRouter.get("/:id", getProduct);

productsRouter.patch("/:id", toggleProductIsDeleted);

export { productsRouter };
