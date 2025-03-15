import { Router } from "express";

import { createProfile } from "~/controllers/public/profile";
import { verifyRequest } from "~/middlewares/auth";
import { uploadOne } from "~/middlewares/upload";

const profileRouter = Router();

profileRouter.post(
  "/",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedRoles: ["UNSPECIFIED"],
  }),
  uploadOne("picture"),
  createProfile,
);

export { profileRouter };
