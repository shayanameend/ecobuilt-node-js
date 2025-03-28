import * as zod from "zod";

const getProductsQuerySchema = zod.object({
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
    .enum(["RELEVANCE", "LATEST", "OLDEST"], {
      message: "Sort must be one of 'RELEVANCE', 'LATEST', 'OLDEST'",
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
  minStock: zod.coerce
    .number({
      message: "Stock must be a number",
    })
    .int({
      message: "Stock must be an integer",
    })
    .min(0, {
      message: "Stock must be a non-negative number",
    })
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
  isDeleted: zod
    .preprocess(
      (val) => (val === "true" ? true : val === "false" ? false : val),
      zod.boolean({
        message: "isDeleted must be a boolean",
      }),
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
  vendorId: zod
    .string({
      message: "Vendor ID must be a string",
    })
    .length(24, {
      message: "Vendor ID must be a 24-character string",
    })
    .optional(),
});

const getProductParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const toggleProductIsDeletedParamsSchema = zod.object({
  id: zod
    .string({
      message: "ID must be a string",
    })
    .length(24, {
      message: "ID must be a 24-character string",
    }),
});

const toggleProductIsDeletedQuerySchema = zod.object({
  isDeleted: zod.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    zod.boolean({
      message: "isDeleted must be a boolean",
    }),
  ),
});

export {
  getProductsQuerySchema,
  getProductParamsSchema,
  toggleProductIsDeletedParamsSchema,
  toggleProductIsDeletedQuerySchema,
};
