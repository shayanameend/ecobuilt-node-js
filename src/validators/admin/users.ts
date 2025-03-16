import { UserStatus } from "@prisma/client";
import * as zod from "zod";

const getUsersQuerySchema = zod.object({
  page: zod.coerce
    .number({
      message: "Page must be a number",
    })
    .int({
      message: "Page must be an integer",
    })
    .min(1, {
      message: "Page must be a positive number",
    })
    .default(1),
  limit: zod.coerce
    .number({
      message: "Limit must be a number",
    })
    .int({
      message: "Limit must be an integer",
    })
    .min(1, {
      message: "Limit must be a positive number",
    })
    .default(10),
  sort: zod
    .enum(["LATEST", "OLDEST"], {
      message: "Sort must be one of 'LATEST', 'OLDEST'",
    })
    .optional(),
  email: zod
    .string({
      message: "Email must be a string",
    })
    .email({
      message: "Email must be a valid email address",
    })
    .optional(),
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(1, {
      message: "Name must be at least 1 characters long",
    })
    .optional(),
  phone: zod
    .string({
      message: "Phone must be a string",
    })
    .min(1, {
      message: "Phone must be at least 1 characters long",
    })
    .optional(),
  postalCode: zod
    .string({
      message: "Postal code must be a string",
    })
    .min(1, {
      message: "Postal code must be at least 1 characters long",
    })
    .optional(),
  city: zod
    .string({
      message: "City must be a string",
    })
    .min(1, {
      message: "City must be at least 1 characters long",
    })
    .optional(),
  deliveryAddress: zod
    .string({
      message: "Delivery address must be a string",
    })
    .min(1, {
      message: "Delivery address must be at least 1 characters long",
    })
    .optional(),
  status: zod
    .enum([UserStatus.PENDING, UserStatus.REJECTED, UserStatus.APPROVED], {
      message: "Status must be one of 'PENDING', 'REJECTED', 'APPROVED'",
    })
    .optional(),
  isVerified: zod
    .preprocess(
      (val) => (val === "true" ? true : val === "false" ? false : val),
      zod.boolean({
        message: "isVerified must be a boolean",
      }),
    )
    .optional(),
  isDeleted: zod
    .preprocess(
      (val) => (val === "true" ? true : val === "false" ? false : val),
      zod.boolean({
        message: "isDeleted must be a boolean",
      }),
    )
    .optional(),
});

const getUserParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const updateUserParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const updateUserBodySchema = zod.object({
  status: zod
    .enum([UserStatus.PENDING, UserStatus.REJECTED, UserStatus.APPROVED], {
      message: "Status must be one of 'PENDING', 'REJECTED', 'APPROVED'",
    })
    .optional(),
  isDeleted: zod
    .preprocess(
      (val) => (val === "true" ? true : val === "false" ? false : val),
      zod.boolean({
        message: "isDeleted must be a boolean",
      }),
    )
    .optional(),
});

export {
  getUsersQuerySchema,
  getUserParamsSchema,
  updateUserParamsSchema,
  updateUserBodySchema,
};
