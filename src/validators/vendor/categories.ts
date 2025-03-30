import * as zod from "zod";

const suggestCategoryBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(3, {
      message: "Name must be at least 3 characters long",
    })
    .max(255, {
      message: "Name must be at most 255 characters long",
    }),
});

export { suggestCategoryBodySchema };
