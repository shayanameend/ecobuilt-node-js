import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getProfileService,
  updateProfileService,
} from "~/services/admin/profile";
import { updateProfileBodySchema } from "~/validators/admin/profile";

async function getProfile(request: Request, response: Response) {
  try {
    const { profile } = await getProfileService({
      userId: request.user.id,
    });

    return response.success(
      {
        data: {
          profile,
        },
      },
      {
        message: "Profile fetched successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function updateProfile(request: Request, response: Response) {
  try {
    const { name, phone } = updateProfileBodySchema.parse(request.body);

    const { profile } = await updateProfileService({
      userId: request.user.id,
      name,
      phone,
      pictureId: request.body.pictureId,
      file: request.file,
    });

    return response.success(
      {
        data: {
          profile,
        },
      },
      {
        message: "Profile updated successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

export { getProfile, updateProfile };
