import { Router } from "express";

import { createCategory } from "~/controllers/vendor/categories";

const categoriesRouter = Router();

categoriesRouter.post("/", createCategory);

export { categoriesRouter };
