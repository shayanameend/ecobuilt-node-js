import * as zod from "zod";

const updateProfileBodySchema = zod.object({
  pictureId: zod
    .string({
      message: "Picture ID must be a string",
    })
    .min(36, {
      message: "Picture ID must be a 40-character string",
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
  postalCode: zod
    .string({
      message: "Postal Code must be a string",
    })
    .min(3, {
      message: "Postal Code must be at least 3 characters",
    })
    .max(255, {
      message: "Postal Code must be at most 255 characters",
    })
    .optional(),
  city: zod
    .string({
      message: "City must be a string",
    })
    .min(3, {
      message: "City must be at least 3 characters",
    })
    .max(255, {
      message: "City must be at most 255 characters",
    })
    .optional(),
  deliveryAddress: zod
    .string({
      message: "Delivery Address must be a string",
    })
    .min(3, {
      message: "Delivery Address must be at least 3 characters",
    })
    .max(255, {
      message: "Delivery Address must be at most 255 characters",
    })
    .optional(),
});

export { updateProfileBodySchema };
