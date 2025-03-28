import { Router } from "express";

import {
  getProduct,
  getProducts,
  toggleProductIsDeleted,
} from "~/controllers/admin/products";

const productsRouter = Router();

productsRouter.get("/", getProducts);

productsRouter.get("/:id", getProduct);

productsRouter.delete("/:id", toggleProductIsDeleted);

export { productsRouter };
