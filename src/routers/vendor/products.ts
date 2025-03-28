import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "~/controllers/vendor/products";
import { uploadMultiple } from "~/middlewares/upload";

const productsRouter = Router();

productsRouter.get("/", getProducts);

productsRouter.get("/:id", getProduct);

productsRouter.post("/", uploadMultiple("pictures"), createProduct);

productsRouter.put("/:id", uploadMultiple("pictures"), updateProduct);

productsRouter.patch("/:id", deleteProduct);

export { productsRouter };
