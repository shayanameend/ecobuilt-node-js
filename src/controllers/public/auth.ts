import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  forgotPasswordService,
  refreshTokenService,
  resendOtpService,
  signInService,
  signUpService,
  updatePasswordService,
  verifyOtpService,
} from "~/services/public/auth";
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
    const { email, password } = signUpBodySchema.parse(request.body);

    const { token } = await signUpService({ email, password });

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
    const { email, password } = signInBodySchema.parse(request.body);

    const { token, user } = await signInService({ email, password });

    if (!user) {
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
    const { email } = forgotPasswordBodySchema.parse(request.body);

    const { token } = await forgotPasswordService({ email });

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

    await resendOtpService({
      userId: request.user.id,
      email: request.user.email,
      type,
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

    const result = await verifyOtpService({
      userId: request.user.id,
      email: request.user.email,
      otp,
      type,
    });

    if (type === "VERIFY" && result.user) {
      request.user = result.user;
    }

    return response.success(
      {
        data: {
          token: result.token,
          user: result.user,
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

    await updatePasswordService({
      userId: request.user.id,
      password,
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
    const { token, user } = await refreshTokenService({
      email: request.user.email,
      user: request.user,
    });

    return response.success(
      {
        data: {
          token,
          user,
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
