import type { Prisma, UserStatus } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";

/**
 * Get admins with filters
 */
async function getAdminsService({
  userId,
  page,
  limit,
  sort,
  email,
  name,
  phone,
  status,
  isVerified,
  isDeleted,
}: {
  userId: string;
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  email?: string;
  name?: string;
  phone?: string;
  status?: UserStatus;
  isVerified?: boolean;
  isDeleted?: boolean;
}) {
  const where: Prisma.AdminWhereInput = {};
  const authWhere: Prisma.AuthWhereInput = {
    id: {
      not: userId,
    },
  };

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

  const admins = await prisma.admin.findMany({
    where,
    take: limit,
    skip: (page - 1) * limit,
    orderBy: {
      ...(sort === "LATEST" && { createdAt: "desc" }),
      ...(sort === "OLDEST" && { createdAt: "asc" }),
    },
    select: {
      ...adminSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  const total = await prisma.admin.count({ where });
  const pages = Math.ceil(total / limit);

  return {
    admins,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single admin
 */
async function getAdminService({
  adminId,
}: {
  adminId: string;
}) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      ...adminSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  if (!admin) {
    throw new NotFoundResponse("Admin not found");
  }

  return { admin };
}

/**
 * Update an admin's auth information
 */
async function updateAdminService({
  adminId,
  data,
}: {
  adminId: string;
  data: Prisma.AuthUpdateInput;
}) {
  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: {
      auth: {
        update: data,
      },
    },
    select: {
      ...adminSelector.profile,
      auth: {
        select: {
          ...adminSelector.auth,
        },
      },
    },
  });

  if (!admin) {
    throw new NotFoundResponse("Admin not found");
  }

  return { admin };
}

export { getAdminsService, getAdminService, updateAdminService };
