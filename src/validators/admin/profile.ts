import * as zod from "zod";

const updateProfileBodySchema = zod.object({
  pictureId: zod
    .string()
    .min(36, {
      message: "Picture ID is invalid",
    })
    .optional(),
  name: zod
    .string({
      message: "Name must be a string",
    })
    .min(3, {
      message: "Name must be at least 3 characters",
    })
    .max(255, {
      message: "Name must be at most 255 characters",
    })
    .optional(),
  phone: zod
    .string({
      message: "Phone must be a string",
    })
    .min(3, {
      message: "Phone must be at least 3 characters",
    })
    .max(255, {
      message: "Phone must be at most 255 characters",
    })
    .optional(),
});

export { updateProfileBodySchema };
