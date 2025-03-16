import { Role } from "@prisma/client";

import * as zod from "zod";

const createProfileBodySchema = zod.object({
  role: zod.enum([Role.SUPER_ADMIN, Role.ADMIN, Role.VENDOR, Role.USER], {
    message: "Role must be one of 'SUPER_ADMIN', 'ADMIN', 'VENDOR', 'USER'",
  }),
});

const createAdminProfileBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(3, {
      message: "Name must be at least 3 characters",
    })
    .max(255, {
      message: "Name must be at most 255 characters",
    }),
  phone: zod
    .string({
      message: "Phone must be a string",
    })
    .min(3, {
      message: "Phone must be at least 3 characters",
    })
    .max(255, {
      message: "Phone must be at most 255 characters",
    }),
});

const createVendorProfileBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(3, {
      message: "Name must be at least 3 characters",
    })
    .max(255, {
      message: "Name must be at most 255 characters",
    }),
  description: zod
    .string({
      message: "Description must be a string",
    })
    .min(3, {
      message: "Description must be at least 3 characters",
    })
    .max(255, {
      message: "Description must be at most 255 characters",
    }),
  phone: zod
    .string({
      message: "Phone must be a string",
    })
    .min(3, {
      message: "Phone must be at least 3 characters",
    })
    .max(255, {
      message: "Phone must be at most 255 characters",
    }),
  postalCode: zod
    .string({
      message: "Postal Code must be a string",
    })
    .min(3, {
      message: "Postal Code must be at least 3 characters",
    })
    .max(255, {
      message: "Postal Code must be at most 255 characters",
    }),
  city: zod
    .string({
      message: "City must be a string",
    })
    .min(3, {
      message: "City must be at least 3 characters",
    })
    .max(255, {
      message: "City must be at most 255 characters",
    }),
  pickupAddress: zod
    .string({
      message: "Pickup Address must be a string",
    })
    .min(3, {
      message: "Pickup Address must be at least 3 characters",
    })
    .max(255, {
      message: "Pickup Address must be at most 255 characters",
    }),
});

const createUserProfileBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(3, {
      message: "Name must be at least 3 characters",
    })
    .max(255, {
      message: "Name must be at most 255 characters",
    }),
  phone: zod
    .string({
      message: "Phone must be a string",
    })
    .min(3, {
      message: "Phone must be at least 3 characters",
    })
    .max(255, {
      message: "Phone must be at most 255 characters",
    }),
  postalCode: zod
    .string({
      message: "Postal Code must be a string",
    })
    .min(3, {
      message: "Postal Code must be at least 3 characters",
    })
    .max(255, {
      message: "Postal Code must be at most 255 characters",
    }),
  city: zod
    .string({
      message: "City must be a string",
    })
    .min(3, {
      message: "City must be at least 3 characters",
    })
    .max(255, {
      message: "City must be at most 255 characters",
    }),
  deliveryAddress: zod
    .string({
      message: "Delivery Address must be a string",
    })
    .min(3, {
      message: "Delivery Address must be at least 3 characters",
    })
    .max(255, {
      message: "Delivery Address must be at most 255 characters",
    }),
});

export {
  createProfileBodySchema,
  createAdminProfileBodySchema,
  createVendorProfileBodySchema,
  createUserProfileBodySchema,
};
