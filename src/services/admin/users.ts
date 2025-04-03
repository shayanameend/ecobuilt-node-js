import type { Prisma, UserStatus } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { userSelector } from "~/selectors/user";

/**
 * Get users with filters
 */
async function getUsersService({
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
}: {
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  email?: string;
  name?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  deliveryAddress?: string;
  status?: UserStatus;
  isVerified?: boolean;
  isDeleted?: boolean;
}) {
  const where: Prisma.UserWhereInput = {};
  const authWhere: Prisma.AuthWhereInput = {};

  if (email) {
    authWhere.email = {
      contains: email,
      mode: "insensitive",
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

  if (status) {
    authWhere.status = status;
  }

  if (isVerified !== undefined) {
    authWhere.isVerified = isVerified;
  }

  if (isDeleted !== undefined) {
    authWhere.isDeleted = isDeleted;
  }

  if (Object.keys(authWhere).length > 0) {
    where.auth = authWhere;
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
          ...adminSelector.auth,
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
 * Get a single user
 */
async function getUserService({
  userId,
}: {
  userId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundResponse("User not found");
  }

  return { user };
}

/**
 * Update a user's auth information
 */
async function updateUserService({
  userId,
  data,
}: {
  userId: string;
  data: Prisma.AuthUpdateInput;
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      auth: {
        update: data,
      },
    },
    select: {
      ...userSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundResponse("User not found");
  }

  return { user };
}

export { getUsersService, getUserService, updateUserService };
