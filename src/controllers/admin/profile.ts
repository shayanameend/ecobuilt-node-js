import type { Request, Response } from "express";

import { BadResponse, NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { addFile, removeFile } from "~/utils/file";
import { updateProfileBodySchema } from "~/validators/admin/profile";

async function getProfile(request: Request, response: Response) {
  try {
    const profile = await prisma.admin.findUnique({
      where: {
        authId: request.user.id,
      },
      select: {
        ...adminSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundResponse("Profile not found");
    }

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
    if (request.body.pictureId && !request.file) {
      throw new BadResponse("Profile picture is required");
    }

    if (request.file && !request.body.pictureId) {
      throw new BadResponse("Picture ID is required");
    }

    let pictureId = request.body.pictureId;

    if (pictureId) {
      removeFile({
        key: pictureId,
      });
    }

    if (request.file) {
      pictureId = addFile({
        file: request.file,
      });
    }

    const { name, phone } = updateProfileBodySchema.parse(request.body);

    const profile = await prisma.admin.update({
      where: {
        authId: request.user.id,
      },
      data: {
        pictureId,
        name,
        phone,
      },
      select: {
        ...adminSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
          },
        },
      },
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
