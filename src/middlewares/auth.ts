import type { OtpType, Role, UserStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { TokenType } from "~/types";

import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import {
  BadResponse,
  ForbiddenResponse,
  NotFoundResponse,
  UnauthorizedResponse,
  handleErrors,
} from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { verifyToken } from "~/utils/jwt";

interface VerifyRequestParams {
  isVerified?: boolean;
  isDeleted?: boolean;
  allowedTypes: TokenType[];
  allowedStatus?: UserStatus[];
  allowedRoles?: Role[];
}

function verifyRequest({
  isVerified,
  isDeleted,
  allowedTypes,
  allowedStatus,
  allowedRoles,
}: Readonly<VerifyRequestParams>) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const bearerToken = request.headers.authorization;

      if (!bearerToken) {
        throw new UnauthorizedResponse("Unauthorized!");
      }

      const token = bearerToken.split(" ")[1];

      if (!token) {
        throw new UnauthorizedResponse("Unauthorized!");
      }

      const decodedUser = (await verifyToken(token)) as {
        email: string;
        type: OtpType;
      };

      if (allowedTypes.length > 0 && !allowedTypes.includes(decodedUser.type)) {
        throw new ForbiddenResponse("Forbidden!");
      }

      const user = await prisma.auth.findUnique({
        where: {
          email: decodedUser.email,
        },
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

      if (!user) {
        throw new NotFoundResponse("User Not Found!");
      }

      if (isVerified && !user?.isVerified) {
        throw new BadResponse("User Not Verified!");
      }

      if (isDeleted && user?.isDeleted) {
        throw new BadResponse("User Deleted!");
      }

      if (
        allowedStatus &&
        allowedStatus.length > 0 &&
        !allowedStatus.includes(user.status)
      ) {
        throw new ForbiddenResponse("Forbidden!");
      }

      if (
        allowedRoles &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role)
      ) {
        throw new ForbiddenResponse("Forbidden!");
      }

      request.user = user;

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return response.unauthorized(
          {},
          {
            message: "Token Expired!",
          },
        );
      }

      if (error instanceof JsonWebTokenError) {
        return response.unauthorized(
          {},
          {
            message: "Invalid Token!",
          },
        );
      }

      return handleErrors({ response, error });
    }
  };
}

export { verifyRequest };
