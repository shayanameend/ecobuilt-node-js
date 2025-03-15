import * as zod from "zod";

const createReviewParamsSchema = zod.object({
  orderId: zod
    .string({
      message: "Product ID must be a string!",
    })
    .length(24, {
      message: "Product ID must be a 24-character string!",
    }),
});

const createReviewBodySchema = zod.object({
  rating: zod.coerce
    .number({
      message: "Rating must be a number!",
    })
    .int({
      message: "Rating must be an integer!",
    })
    .min(1, {
      message: "Rating must be at least 1!",
    })
    .max(5, {
      message: "Rating must be at most 5!",
    }),
  comment: zod
    .string({
      message: "Comment must be a string!",
    })
    .min(1, {
      message: "Comment must be at least 1 character long!",
    }),
});

export { createReviewParamsSchema, createReviewBodySchema };
