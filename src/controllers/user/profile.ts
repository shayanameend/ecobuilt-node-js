import type { Request, Response } from "express";

import { BadResponse, NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { addFile, removeFile } from "~/utils/file";
import { updateProfileBodySchema } from "~/validators/user/profile";

async function getProfile(request: Request, response: Response) {
  try {
    const profile = await prisma.user.findUnique({
      where: {
        authId: request.user.id,
      },
      select: {
        ...userSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundResponse("Profile not found!");
    }

    return response.success(
      {
        data: {
          profile,
        },
      },
      {
        message: "Profile fetched successfully!",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function updateProfile(request: Request, response: Response) {
  try {
    if (request.body.pictureId && !request.file) {
      throw new BadResponse("Profile picture is required!");
    }

    if (request.file && !request.body.pictureId) {
      throw new BadResponse("Picture ID is required!");
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

    const { name, phone, postalCode, city, deliveryAddress } =
      updateProfileBodySchema.parse(request.body);

    const profile = await prisma.user.update({
      where: {
        authId: request.user.id,
      },
      data: {
        pictureId,
        name,
        phone,
        postalCode,
        city,
        deliveryAddress,
      },
      select: {
        ...userSelector.profile,
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
        message: "Profile updated successfully!",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

export { getProfile, updateProfile };
