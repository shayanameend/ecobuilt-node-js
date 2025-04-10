import { Router } from "express";

import { getDashboardKPIs } from "../../controllers/vendor/dashboard";

const dashboardRouter = Router();

dashboardRouter.get("/", getDashboardKPIs);

export { dashboardRouter };
