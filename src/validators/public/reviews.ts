import * as zod from "zod";

const getReviewsParamsSchema = zod.object({
  productId: zod
    .string({
      message: "Product ID must be a string",
    })
    .length(24, {
      message: "Product ID must be a 24-character string",
    }),
});

const getReviewsQuerySchema = zod.object({
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
});

export { getReviewsParamsSchema, getReviewsQuerySchema };
