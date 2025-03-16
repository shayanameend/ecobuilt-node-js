import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import {
  getAdminParamsSchema,
  getAdminsQuerySchema,
  updateAdminBodySchema,
  updateAdminParamsSchema,
} from "~/validators/admin/admins";

async function getAdmins(request: Request, response: Response) {
  try {
    const {
      page,
      limit,
      sort,
      email,
      name,
      phone,
      status,
      isVerified,
      isDeleted,
    } = getAdminsQuerySchema.parse(request.query);

    const where: Prisma.AdminWhereInput = {};

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

    if (status) {
      where.auth = {
        status,
      };
    }

    if (isVerified !== undefined) {
      where.auth = {
        isVerified,
      };
    }

    if (isDeleted !== undefined) {
      where.auth = {
        isDeleted,
      };
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

    return response.success(
      {
        data: { admins },
        meta: { total, pages, limit, page },
      },
      {
        message: "Admins fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getAdmin(request: Request, response: Response) {
  try {
    const { id } = getAdminParamsSchema.parse(request.params);

    const admin = await prisma.admin.findUnique({
      where: { id },
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

    return response.success(
      {
        data: { admin },
      },
      {
        message: "Admin fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateAdmin(request: Request, response: Response) {
  try {
    const { id } = updateAdminParamsSchema.parse(request.params);
    const validatedData = updateAdminBodySchema.parse(request.body);

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        auth: {
          update: validatedData,
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

    return response.success(
      {
        data: { admin },
      },
      {
        message: "Admin updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getAdmins, getAdmin, updateAdmin };
