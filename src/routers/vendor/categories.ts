import { Router } from "express";

import { suggestCategory } from "~/controllers/vendor/categories";

const categoriesRouter = Router();

categoriesRouter.post("/", suggestCategory);

export { categoriesRouter };
