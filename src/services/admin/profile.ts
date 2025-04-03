import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { addFile, removeFile } from "~/utils/file";

/**
 * Get admin profile
 */
async function getProfileService({ userId }: { userId: string }) {
  const profile = await prisma.admin.findUnique({
    where: {
      authId: userId,
    },
    select: {
      ...adminSelector.profile,
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
 * Update admin profile
 */
async function updateProfileService({
  userId,
  name,
  phone,
  pictureId,
  file,
}: {
  userId: string;
  name: string | undefined;
  phone: string | undefined;
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

  const profile = await prisma.admin.update({
    where: {
      authId: userId,
    },
    data: {
      pictureId: newPictureId,
      name,
      phone,
    },
    select: {
      ...adminSelector.profile,
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
