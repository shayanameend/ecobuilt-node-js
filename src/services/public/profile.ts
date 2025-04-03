import type { Role } from "@prisma/client";

import { BadResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";
import { addFile } from "~/utils/file";

/**
 * Create a profile for a user based on their role
 */
async function createProfileService({
  userId,
  role,
  file,
  name,
  description,
  phone,
  postalCode,
  city,
  pickupAddress,
  deliveryAddress,
}: {
  userId: string;
  role: Role;
  file: Express.Multer.File;
  name: string;
  description: string;
  phone: string;
  postalCode: string;
  city: string;
  pickupAddress: string;
  deliveryAddress: string;
}) {
  if (!file) {
    throw new BadResponse("Profile picture is required");
  }

  const pictureId = await addFile({
    file,
  });

  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN": {
      const profile = await prisma.$transaction(async (tx) => {
        const adminProfile = await tx.admin.create({
          data: {
            pictureId,
            name,
            phone,
            auth: {
              connect: {
                id: userId,
              },
            },
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

        await tx.auth.update({
          where: {
            id: userId,
          },
          data: {
            role,
          },
        });

        return adminProfile;
      });

      return { profile };
    }
    case "VENDOR": {
      const profile = await prisma.$transaction(async (tx) => {
        const vendorProfile = await tx.vendor.create({
          data: {
            pictureId,
            name,
            description,
            phone,
            postalCode,
            city,
            pickupAddress,
            auth: {
              connect: {
                id: userId,
              },
            },
          },
          select: {
            ...vendorSelector.profile,
            auth: {
              select: {
                ...publicSelector.auth,
              },
            },
          },
        });

        await tx.auth.update({
          where: {
            id: userId,
          },
          data: {
            role,
          },
        });

        return vendorProfile;
      });

      return { profile };
    }
    case "USER": {
      const profile = await prisma.$transaction(async (tx) => {
        const userProfile = await tx.user.create({
          data: {
            pictureId,
            name,
            phone,
            postalCode,
            city,
            deliveryAddress,
            auth: {
              connect: {
                id: userId,
              },
            },
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

        await tx.auth.update({
          where: {
            id: userId,
          },
          data: {
            status: "APPROVED",
            role,
          },
        });

        return userProfile;
      });

      return { profile };
    }
    default:
      throw new BadResponse("Invalid role");
  }
}

export { createProfileService };
