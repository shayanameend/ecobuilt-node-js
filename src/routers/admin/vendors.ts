import { Router } from "express";

import {
  getVendor,
  getVendors,
  updateVendor,
} from "~/controllers/admin/vendors";

const vendorsRouter = Router();

vendorsRouter.get("/", getVendors);

vendorsRouter.get("/:id", getVendor);

vendorsRouter.put("/:id", updateVendor);

export { vendorsRouter };
