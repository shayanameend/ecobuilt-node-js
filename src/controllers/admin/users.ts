import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getUserService,
  getUsersService,
  updateUserService,
} from "~/services/admin/users";
import {
  getUserParamsSchema,
  getUsersQuerySchema,
  updateUserBodySchema,
  updateUserParamsSchema,
} from "~/validators/admin/users";

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
      status,
      isVerified,
      isDeleted,
    } = getUsersQuerySchema.parse(request.query);

    const {
      users,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getUsersService({
      page,
      limit,
      sort,
      email,
      name,
      phone,
      postalCode,
      city,
      deliveryAddress,
      status,
      isVerified,
      isDeleted,
    });

    return response.success(
      {
        data: { users },
        meta: { total, pages, limit: responseLimit, page: responsePage },
      },
      {
        message: "Users fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getUser(request: Request, response: Response) {
  try {
    const { id } = getUserParamsSchema.parse(request.params);

    const { user } = await getUserService({
      userId: id,
    });

    return response.success(
      {
        data: { user },
      },
      {
        message: "User fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateUser(request: Request, response: Response) {
  try {
    const { id } = updateUserParamsSchema.parse(request.params);
    const validatedData = updateUserBodySchema.parse(request.body);

    const { user } = await updateUserService({
      userId: id,
      data: validatedData,
    });

    return response.success(
      {
        data: { user },
      },
      {
        message: "User updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getUsers, getUser, updateUser };
