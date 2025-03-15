import { Router } from "express";

import { getVendor, getVendors } from "~/controllers/public/vendors";

const vendorsRouter = Router();

vendorsRouter.get("/", getVendors);
vendorsRouter.get("/:id", getVendor);

export { vendorsRouter };
