import { Router } from "express";

import { getProfile, updateProfile } from "~/controllers/user/profile";
import { uploadOne } from "~/middlewares/upload";

const profileRouter = Router();

profileRouter.get("/", getProfile);

profileRouter.put("/", uploadOne("picture"), updateProfile);

export { profileRouter };
