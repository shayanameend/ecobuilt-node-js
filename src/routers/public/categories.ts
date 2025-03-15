import { Router } from "express";

import { getCategories } from "~/controllers/public/categories";

const categoriesRouter = Router();

categoriesRouter.get("/", getCategories);

export { categoriesRouter };
