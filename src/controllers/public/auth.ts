import type { Request, Response } from "express";

import { default as argon } from "argon2";

import { BadResponse, NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { signToken } from "~/utils/jwt";
import { sendOTP } from "~/utils/mail";
import {
  forgotPasswordBodySchema,
  resendOtpBodySchema,
  signInBodySchema,
  signUpBodySchema,
  updatePasswordBodySchema,
  verifyOtpBodySchema,
} from "~/validators/public/auth";

async function signUp(request: Request, response: Response) {
  try {
    if (request.body.email) {
      request.body.email = request.body.email.toLowerCase();
    }

    const { email, password } = signUpBodySchema.parse(request.body);

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

    return response.created(
      {
        data: { token },
      },
      {
        message: "Sign Up Successfull",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function signIn(request: Request, response: Response) {
  try {
    if (request.body.email) {
      request.body.email = request.body.email.toLowerCase();
    }

    const { email, password } = signInBodySchema.parse(request.body);

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

      return response.success(
        {
          data: {
            token,
          },
        },
        {
          message: "OTP Sent Successfully",
        },
      );
    }

    const token = await signToken({
      email: user.email,
      type: "ACCESS",
    });

    // @ts-ignore
    user.password = undefined;

    return response.success(
      {
        data: {
          token,
          user,
        },
      },
      {
        message: "Sign In Successfull",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function forgotPassword(request: Request, response: Response) {
  try {
    if (request.body.email) {
      request.body.email = request.body.email.toLowerCase();
    }

    const { email } = forgotPasswordBodySchema.parse(request.body);

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

    return response.success(
      {
        data: { token },
      },
      {
        message: "OTP Sent Successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function resendOtp(request: Request, response: Response) {
  try {
    const { type } = resendOtpBodySchema.parse(request.body);

    const sampleSpace = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let code = "";

    for (let i = 0; i < 6; i++) {
      code += sampleSpace[Math.floor(Math.random() * sampleSpace.length)];
    }

    const otp = await prisma.otp.upsert({
      where: {
        authId: request.user.id,
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
            id: request.user.id,
          },
        },
      },
    });

    sendOTP({
      to: request.user.email,
      code: otp.code,
    });

    return response.success(
      {},
      {
        message: "OTP Sent Successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function verifyOtp(request: Request, response: Response) {
  try {
    const { otp, type } = verifyOtpBodySchema.parse(request.body);

    const existingOtp = await prisma.otp.findUnique({
      where: {
        authId: request.user.id,
        type,
      },
    });

    if (!existingOtp) {
      throw new BadResponse("Invalid OTP");
    }

    if (existingOtp.code !== otp) {
      throw new BadResponse("Invalid OTP");
    }

    if (type === "VERIFY") {
      request.user = await prisma.auth.update({
        where: { id: request.user.id },
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
        authId: request.user.id,
        type,
      },
    });

    const token = await signToken({
      email: request.user.email,
      type: type === "VERIFY" ? "ACCESS" : type,
    });

    return response.success(
      {
        data: {
          token,
          user: type === "VERIFY" ? request.user : undefined,
        },
      },
      {
        message: "OTP Verified Successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function updatePassword(request: Request, response: Response) {
  try {
    const { password } = updatePasswordBodySchema.parse(request.body);

    const hashedPassword = await argon.hash(password);

    await prisma.auth.update({
      where: { id: request.user.id },
      data: { password: hashedPassword },
      select: {
        ...adminSelector.auth,
      },
    });

    return response.success(
      {
        data: {},
      },
      {
        message: "Password Updated Successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

async function refresh(request: Request, response: Response) {
  try {
    const token = await signToken({
      email: request.user.email,
      type: "ACCESS",
    });

    return response.success(
      {
        data: {
          token,
          user: request.user,
        },
      },
      {
        message: "Token Refreshed Successfully",
      },
    );
  } catch (error) {
    return handleErrors({ response, error });
  }
}

export {
  signUp,
  signIn,
  forgotPassword,
  resendOtp,
  verifyOtp,
  updatePassword,
  refresh,
};
