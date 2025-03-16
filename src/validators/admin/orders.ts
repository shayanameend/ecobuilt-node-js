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
        OrderStatus.RETURNED,
      ],
      {
        message:
          "Status must be one of 'PENDING', 'REJECTED', 'APPROVED', 'CANCELLED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'",
      },
    )
    .optional(),
  minPrice: zod.coerce
    .number({
      message: "Min Price must be a number",
    })
    .min(1, {
      message: "Min Price must be a positive number",
    })
    .optional(),
  maxPrice: zod.coerce
    .number({
      message: "Max Price must be a number",
    })
    .min(1, {
      message: "Max Price must be a positive number",
    })
    .optional(),
  categoryId: zod
    .string({
      message: "Category ID must be a string",
    })
    .length(24, {
      message: "Category ID must be a 24-character string",
    })
    .optional(),
  vendorId: zod
    .string({
      message: "Vendor ID must be a string",
    })
    .length(24, {
      message: "Vendor ID must be a 24-character string",
    })
    .optional(),
  productId: zod
    .string({
      message: "Product ID must be a string",
    })
    .length(24, {
      message: "Product ID must be a 24-character string",
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
  status: zod.enum(
    [OrderStatus.PROCESSING, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
    {
      message: "Status must be one of 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'",
    },
  ),
});

export {
  getOrdersQuerySchema,
  getOrderParamsSchema,
  toggleOrderStatusParamsSchema,
  toggleOrderStatusBodySchema,
};
