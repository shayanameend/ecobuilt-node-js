import { OrderStatus } from "@prisma/client";
import * as zod from "zod";

const getOrdersQuerySchema = zod.object({
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
  status: zod
    .enum(
      [
        OrderStatus.PENDING,
        OrderStatus.REJECTED,
        OrderStatus.APPROVED,
        OrderStatus.CANCELLED,
        OrderStatus.PROCESSING,
        OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED,
      ],
      {
        message:
          "Status must be one of 'PENDING', 'REJECTED', 'APPROVED', 'CANCELLED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'",
      },
    )
    .optional(),
  categoryId: zod
    .string({
      message: "Category ID must be a string",
    })
    .length(24, {
      message: "Category ID must be a 24-character string",
    })
    .optional(),
  userName: zod
    .string({
      message: "User name must be a string",
    })
    .min(1, {
      message: "User name must be at least 1 character long",
    })
    .optional(),
  productName: zod
    .string({
      message: "Product name must be a string",
    })
    .min(1, {
      message: "Product name must be at least 1 character long",
    })
    .optional(),
  minTotalPrice: zod.coerce
    .number({
      message: "Minimum total price must be a number",
    })
    .min(0, {
      message: "Minimum total price must be a non-negative number",
    })
    .optional(),
  maxTotalPrice: zod.coerce
    .number({
      message: "Maximum total price must be a number",
    })
    .min(0, {
      message: "Maximum total price must be a non-negative number",
    })
    .optional(),
});

const getOrderParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const toggleOrderStatusParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const toggleOrderStatusBodySchema = zod.object({
  status: zod.enum([OrderStatus.REJECTED, OrderStatus.APPROVED], {
    message: "Status must be one of 'REJECTED', 'APPROVED'",
  }),
});

export {
  getOrdersQuerySchema,
  getOrderParamsSchema,
  toggleOrderStatusParamsSchema,
  toggleOrderStatusBodySchema,
};
