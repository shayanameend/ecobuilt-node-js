import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { createProfileService } from "~/services/public/profile";
import {
  createAdminProfileBodySchema,
  createProfileBodySchema,
  createUserProfileBodySchema,
  createVendorProfileBodySchema,
} from "~/validators/public/profile";

async function createProfile(request: Request, response: Response) {
  try {
    const { role } = createProfileBodySchema.parse(request.body);

    let profileData: any = {};

    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN": {
        const { name, phone } = createAdminProfileBodySchema.parse(
          request.body,
        );
        profileData = { name, phone };
        break;
      }
      case "VENDOR": {
        const { name, description, phone, postalCode, city, pickupAddress } =
          createVendorProfileBodySchema.parse(request.body);
        profileData = {
          name,
          description,
          phone,
          postalCode,
          city,
          pickupAddress,
        };
        break;
      }
      case "USER": {
        const { name, phone, postalCode, city, deliveryAddress } =
          createUserProfileBodySchema.parse(request.body);
        profileData = { name, phone, postalCode, city, deliveryAddress };
        break;
      }
    }

    const { profile } = await createProfileService({
      userId: request.user.id,
      role,
      file: request.file as Express.Multer.File,
      ...profileData,
    });

    return response.success(
      {
        data: {
          profile,
        },
      },
      {
        message: "Profile created successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

export { createProfile };
