import type { OtpType } from "@prisma/client";
import type { TokenType } from "~/types";

import { default as argon } from "argon2";

import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { signToken } from "~/utils/jwt";
import { sendOTP } from "~/utils/mail";

/**
 * Sign up a new user
 */
async function signUpService({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  email = email.toLowerCase();

  const existingUser = await prisma.auth.findUnique({
    where: { email },
    select: {
      ...adminSelector.auth,
    },
  });

  if (existingUser) {
    throw new BadResponse("User Already Exists");
  }

  const hashedPassword = await argon.hash(password);

  const auth = await prisma.auth.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: {
      ...adminSelector.auth,
    },
  });

  const sampleSpace = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += sampleSpace[Math.floor(Math.random() * sampleSpace.length)];
  }

  const otp = await prisma.otp.upsert({
    where: {
      authId: auth.id,
    },
    update: {
      code,
      type: "VERIFY",
    },
    create: {
      code,
      type: "VERIFY",
      auth: {
        connect: {
          id: auth.id,
        },
      },
    },
  });

  sendOTP({
    to: auth.email,
    code: otp.code,
  });

  const token = await signToken({
    email: auth.email,
    type: "VERIFY",
  });

  return { token };
}

/**
 * Sign in a user
 */
async function signInService({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  email = email.toLowerCase();

  const user = await prisma.auth.findUnique({
    where: { email },
    select: {
      ...adminSelector.auth,
      password: true,
    },
  });

  if (!user) {
    throw new NotFoundResponse("User Not Found");
  }

  const isPasswordValid = await argon.verify(user.password, password);

  if (!isPasswordValid) {
    throw new BadResponse("Invalid Password");
  }

  if (!user.isVerified) {
    const sampleSpace = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let code = "";

    for (let i = 0; i < 6; i++) {
      code += sampleSpace[Math.floor(Math.random() * sampleSpace.length)];
    }

    const otp = await prisma.otp.upsert({
      where: {
        authId: user.id,
      },
      update: {
        code,
        type: "VERIFY",
      },
      create: {
        code,
        type: "VERIFY",
        auth: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    sendOTP({
      to: user.email,
      code: otp.code,
    });

    const token = await signToken({
      email: user.email,
      type: "VERIFY",
    });

    return { token, user: null };
  }

  const token = await signToken({
    email: user.email,
    type: "ACCESS",
  });

  // @ts-ignore
  user.password = undefined;

  return { token, user };
}

/**
 * Forgot password
 */
async function forgotPasswordService({ email }: { email: string }) {
  email = email.toLowerCase();

  const user = await prisma.auth.findUnique({
    where: { email },
    select: {
      ...adminSelector.auth,
    },
  });

  if (!user) {
    throw new NotFoundResponse("User Not Found");
  }

  const sampleSpace = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += sampleSpace[Math.floor(Math.random() * sampleSpace.length)];
  }

  const otp = await prisma.otp.upsert({
    where: {
      authId: user.id,
    },
    update: {
      code,
      type: "RESET",
    },
    create: {
      code,
      type: "RESET",
      auth: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  sendOTP({
    to: user.email,
    code: otp.code,
  });

  const token = await signToken({
    email: user.email,
    type: "RESET",
  });

  return { token };
}

/**
 * Resend OTP
 */
async function resendOtpService({
  userId,
  email,
  type,
}: {
  userId: string;
  email: string;
  type: OtpType;
}) {
  const sampleSpace = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += sampleSpace[Math.floor(Math.random() * sampleSpace.length)];
  }

  const otp = await prisma.otp.upsert({
    where: {
      authId: userId,
    },
    update: {
      code,
      type,
    },
    create: {
      code,
      type,
      auth: {
        connect: {
          id: userId,
        },
      },
    },
  });

  sendOTP({
    to: email,
    code: otp.code,
  });

  return {};
}

/**
 * Verify OTP
 */
async function verifyOtpService({
  userId,
  email,
  otp,
  type,
}: {
  userId: string;
  email: string;
  otp: string;
  type: OtpType;
}) {
  const existingOtp = await prisma.otp.findUnique({
    where: {
      authId: userId,
      type,
    },
  });

  if (!existingOtp) {
    throw new BadResponse("Invalid OTP");
  }

  if (existingOtp.code !== otp) {
    throw new BadResponse("Invalid OTP");
  }

  let user = null;

  if (type === "VERIFY") {
    user = await prisma.auth.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
        isVerified: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  await prisma.otp.delete({
    where: {
      authId: userId,
      type,
    },
  });

  const token = await signToken({
    email,
    type: type === "VERIFY" ? "ACCESS" : type,
  });

  return { token, user: type === "VERIFY" ? user : undefined };
}

/**
 * Update password
 */
async function updatePasswordService({
  userId,
  password,
}: {
  userId: string;
  password: string;
}) {
  const hashedPassword = await argon.hash(password);

  await prisma.auth.update({
    where: { id: userId },
    data: { password: hashedPassword },
    select: {
      ...adminSelector.auth,
    },
  });

  return {};
}

/**
 * Refresh token
 */
async function refreshTokenService({
  email,
  user,
}: {
  email: string;
  user: any;
}) {
  const token = await signToken({
    email,
    type: "ACCESS",
  });

  return { token, user };
}

export {
  signUpService,
  signInService,
  forgotPasswordService,
  resendOtpService,
  verifyOtpService,
  updatePasswordService,
  refreshTokenService,
};
