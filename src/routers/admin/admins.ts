import { Router } from "express";

import { getAdmin, getAdmins, updateAdmin } from "~/controllers/admin/admins";

const adminsRouter = Router();

adminsRouter.get("/", getAdmins);

adminsRouter.get("/:id", getAdmin);

adminsRouter.put("/:id", updateAdmin);

export { adminsRouter };
