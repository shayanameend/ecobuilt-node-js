import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getUserService, getUsersService } from "~/services/vendor/users";
import {
  getUserParamsSchema,
  getUsersQuerySchema,
} from "~/validators/vendor/users";

async function getUsers(request: Request, response: Response) {
  try {
    const {
      page,
      limit,
      sort,
      email,
      name,
      phone,
      postalCode,
      city,
      deliveryAddress,
    } = getUsersQuerySchema.parse(request.query);

    const {
      users,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getUsersService({
      userId: request.user.id,
      page,
      limit,
      sort,
      email,
      name,
      phone,
      postalCode,
      city,
      deliveryAddress,
    });

    return response.success(
      {
        data: { users },
        meta: { total, pages, limit: responseLimit, page: responsePage },
      },
      {
        message: "Users fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getUser(request: Request, response: Response) {
  try {
    const { id } = getUserParamsSchema.parse(request.params);

    const { user } = await getUserService({
      userId: request.user.id,
      userIdToGet: id,
    });

    return response.success(
      {
        data: { user },
      },
      {
        message: "User fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getUsers, getUser };
