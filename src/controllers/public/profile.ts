import type { Request, Response } from "express";

import { BadResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";
import { addFile } from "~/utils/file";
import {
  createAdminProfileBodySchema,
  createProfileBodySchema,
  createUserProfileBodySchema,
  createVendorProfileBodySchema,
} from "~/validators/public/profile";

async function createProfile(request: Request, response: Response) {
  try {
    const { role } = createProfileBodySchema.parse(request.body);

    if (!request.file) {
      throw new BadResponse("Profile picture is required!");
    }

    const pictureId = addFile({
      file: request.file,
    });

    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN": {
        const { name, phone } = createAdminProfileBodySchema.parse(
          request.body,
        );

        const profile = await prisma.$transaction(async (tx) => {
          const adminProfile = await tx.admin.create({
            data: {
              pictureId,
              name,
              phone,
              auth: {
                connect: {
                  id: request.user.id,
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
              id: request.user.id,
            },
            data: {
              role,
            },
          });

          return adminProfile;
        });

        return response.success(
          {
            data: {
              profile,
            },
          },
          {
            message: "Profile created successfully!",
          },
        );
      }
      case "VENDOR": {
        const { name, description, phone, postalCode, city, pickupAddress } =
          createVendorProfileBodySchema.parse(request.body);

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
                  id: request.user.id,
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
              id: request.user.id,
            },
            data: {
              role,
            },
          });

          return vendorProfile;
        });

        return response.success(
          {
            data: {
              profile,
            },
          },
          {
            message: "Profile created successfully!",
          },
        );
      }
      case "USER": {
        const { name, phone, postalCode, city, deliveryAddress } =
          createUserProfileBodySchema.parse(request.body);

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
                  id: request.user.id,
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
              id: request.user.id,
            },
            data: {
              status: "APPROVED",
              role,
            },
          });

          return userProfile;
        });

        return response.success(
          {
            data: {
              profile,
            },
          },
          {
            message: "Profile created successfully!",
          },
        );
      }
    }
  } catch (error) {
    return handleErrors({ response, error });
  }
}

export { createProfile };
