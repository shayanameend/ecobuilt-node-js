import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { vendorSelector } from "~/selectors/vendor";
import { addFile, removeFile } from "~/utils/file";

/**
 * Get vendor profile
 */
async function getProfileService({
  userId,
}: {
  userId: string;
}) {
  const profile = await prisma.vendor.findUnique({
    where: {
      authId: userId,
    },
    select: {
      ...vendorSelector.profile,
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
 * Update vendor profile
 */
async function updateProfileService({
  userId,
  name,
  description,
  phone,
  postalCode,
  city,
  pickupAddress,
  pictureId,
  file,
}: {
  userId: string;
  name: string | undefined;
  description: string | undefined;
  phone: string | undefined;
  postalCode: string | undefined;
  city: string | undefined;
  pickupAddress: string | undefined;
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

  const profile = await prisma.vendor.update({
    where: {
      authId: userId,
    },
    data: {
      pictureId: newPictureId,
      name,
      description,
      phone,
      postalCode,
      city,
      pickupAddress,
    },
    select: {
      ...vendorSelector.profile,
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
