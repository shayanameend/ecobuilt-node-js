import { Router } from "express";

import { getDashboardKPIs } from "~/controllers/admin/dashboard";

const dashboardRouter = Router();

dashboardRouter.get("/", getDashboardKPIs);

export { dashboardRouter };
