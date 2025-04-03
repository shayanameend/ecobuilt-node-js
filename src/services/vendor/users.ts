import type { Prisma } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";

/**
 * Get users for a vendor
 */
async function getUsersService({
  userId,
  page,
  limit,
  sort,
  email,
  name,
  phone,
  postalCode,
  city,
  deliveryAddress,
}: {
  userId: string;
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  email?: string;
  name?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  deliveryAddress?: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      authId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    return {
      users: [],
      total: 0,
      pages: 1,
      limit,
      page,
    };
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

  return {
    users,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single user for a vendor
 */
async function getUserService({
  userId,
  userIdToGet,
}: {
  userId: string;
  userIdToGet: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      authId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("User not found");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userIdToGet,
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
    },
  });

  if (!user) {
    throw new NotFoundResponse("User not found");
  }

  return { user };
}

export { getUsersService, getUserService };
