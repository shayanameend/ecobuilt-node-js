import { OtpType } from "@prisma/client";
import { default as zod } from "zod";

const signUpBodySchema = zod.object({
  email: zod
    .string({
      message: "Email must be a string",
    })
    .email({
      message: "Invalid Email",
    }),
  password: zod
    .string({
      message: "Password must be a string",
    })
    .min(8, {
      message: "Password must be at least 8 characters",
    })
    .max(32, {
      message: "Password must be at most 32 characters",
    }),
});

const signInBodySchema = zod.object({
  email: zod
    .string({
      message: "Email must be a string",
    })
    .email({
      message: "Invalid Email",
    }),
  password: zod
    .string({
      message: "Password must be a string",
    })
    .min(8, {
      message: "Password must be at least 8 characters",
    })
    .max(32, {
      message: "Password must be at most 32 characters",
    }),
});

const forgotPasswordBodySchema = zod.object({
  email: zod
    .string({
      message: "Email must be a string",
    })
    .email({
      message: "Invalid Email",
    }),
});

const resendOtpBodySchema = zod.object({
  type: zod
    .enum([OtpType.VERIFY, OtpType.RESET], {
      message: "Type must be one of VERIFY or RESET",
    })
    .default(OtpType.VERIFY),
});

const verifyOtpBodySchema = zod.object({
  otp: zod
    .string({
      message: "OTP must be a string",
    })
    .length(6, {
      message: "Invalid OTP",
    }),
  type: zod
    .enum([OtpType.VERIFY, OtpType.RESET], {
      message: "Type must be one of VERIFY or RESET",
    })
    .default(OtpType.VERIFY),
});

const updatePasswordBodySchema = zod.object({
  password: zod
    .string({
      message: "Password must be a string",
    })
    .min(8, {
      message: "Password must be at least 8 characters",
    })
    .max(32, {
      message: "Password must be at most 32 characters",
    }),
});

export {
  signUpBodySchema,
  signInBodySchema,
  forgotPasswordBodySchema,
  resendOtpBodySchema,
  verifyOtpBodySchema,
  updatePasswordBodySchema,
};
