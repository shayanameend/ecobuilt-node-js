import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { userSelector } from "~/selectors/user";
import { addFile, removeFile } from "~/utils/file";

/**
 * Get user profile
 */
async function getProfileService({
  userId,
}: {
  userId: string;
}) {
  const profile = await prisma.user.findUnique({
    where: {
      authId: userId,
    },
    select: {
      ...userSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundResponse("Profile not found");
  }

  return { profile };
}

/**
 * Update user profile
 */
async function updateProfileService({
  userId,
  name,
  phone,
  postalCode,
  city,
  deliveryAddress,
  pictureId,
  file,
}: {
  userId: string;
  name: string | undefined;
  phone: string | undefined;
  postalCode: string | undefined;
  city: string | undefined;
  deliveryAddress: string | undefined;
  pictureId?: string;
  file?: Express.Multer.File;
}) {
  if (pictureId && !file) {
    throw new BadResponse("Profile picture is required");
  }

  if (file && !pictureId) {
    throw new BadResponse("Picture ID is required");
  }

  let newPictureId = pictureId;

  if (pictureId) {
    await removeFile({
      key: pictureId,
    });
  }

  if (file) {
    newPictureId = await addFile({
      file,
    });
  }

  const profile = await prisma.user.update({
    where: {
      authId: userId,
    },
    data: {
      pictureId: newPictureId,
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
          ...adminSelector.auth,
        },
      },
    },
  });

  return { profile };
}

export { getProfileService, updateProfileService };
