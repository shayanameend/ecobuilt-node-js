import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
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

    const vendor = await prisma.vendor.findUnique({
      where: {
        authId: request.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      return response.success(
        {
          data: { users: [] },
          meta: { total: 0, pages: 1, limit, page },
        },
        {
          message: "Users fetched successfully!",
        },
      );
    }

    const where: Prisma.UserWhereInput = {
      orders: {
        some: {
          orderToProduct: {
            some: {
              product: {
                vendorId: vendor.id,
              },
            },
          },
        },
      },
    };

    if (email) {
      where.auth = {
        email: {
          contains: email,
          mode: "insensitive",
        },
      };
    }

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (phone) {
      where.phone = {
        contains: phone,
        mode: "insensitive",
      };
    }

    if (postalCode) {
      where.postalCode = {
        contains: postalCode,
        mode: "insensitive",
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    if (deliveryAddress) {
      where.deliveryAddress = {
        contains: deliveryAddress,
        mode: "insensitive",
      };
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        ...(sort === "LATEST" && { createdAt: "desc" }),
        ...(sort === "OLDEST" && { createdAt: "asc" }),
      },
      select: {
        ...userSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
          },
        },
      },
    });

    const total = await prisma.user.count({ where });
    const pages = Math.ceil(total / limit);

    return response.success(
      {
        data: { users },
        meta: { total, pages, limit, page },
      },
      {
        message: "Users fetched successfully!",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getUser(request: Request, response: Response) {
  try {
    const { id } = getUserParamsSchema.parse(request.params);

    const vendor = await prisma.vendor.findUnique({
      where: {
        authId: request.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("User not found!");
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
        orders: {
          some: {
            orderToProduct: {
              some: {
                product: {
                  vendorId: vendor.id,
                },
              },
            },
          },
        },
      },
      select: {
        ...userSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
          },
        },
        orders: {
          select: {
            ...publicSelector.order,
            orderToProduct: {
              select: {
                ...publicSelector.orderToProduct,
                product: {
                  select: {
                    ...publicSelector.product,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundResponse("User not found!");
    }

    return response.success(
      {
        data: { user },
      },
      {
        message: "User fetched successfully!",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getUsers, getUser };
