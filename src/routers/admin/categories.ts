import { Router } from "express";

import {
  createCategory,
  getCategories,
  toggleCategoryIsDeleted,
  updateCategory,
} from "~/controllers/admin/categories";

const categoriesRouter = Router();

categoriesRouter.get("/", getCategories);

categoriesRouter.post("/", createCategory);

categoriesRouter.put("/:id", updateCategory);

categoriesRouter.delete("/:id", toggleCategoryIsDeleted);

export { categoriesRouter };
