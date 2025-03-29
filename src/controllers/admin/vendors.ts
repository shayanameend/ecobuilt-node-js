import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { vendorSelector } from "~/selectors/vendor";
import {
  getVendorParamsSchema,
  getVendorQuerySchema,
  getVendorsQuerySchema,
  updateVendorBodySchema,
  updateVendorParamsSchema,
} from "~/validators/admin/vendors";

async function getVendors(request: Request, response: Response) {
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
      pickupAddress,
      status,
      isVerified,
      isDeleted,
      categoryId,
    } = getVendorsQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        return response.success(
          {
            data: { vendors: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Vendors fetched successfully",
          },
        );
      }
    }

    const where: Prisma.VendorWhereInput = {};
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

    if (pickupAddress) {
      where.pickupAddress = {
        contains: pickupAddress,
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

    if (categoryId) {
      where.products = {
        some: {
          categoryId,
        },
      };
    }

    const vendors = await prisma.vendor.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        ...(sort === "RELEVANCE" && {
          products: {
            _count: "desc",
          },
        }),
        ...(sort === "LATEST" && { createdAt: "desc" }),
        ...(sort === "OLDEST" && { createdAt: "asc" }),
      },
      select: {
        ...vendorSelector.profile,
        auth: {
          select: {
            ...adminSelector.auth,
          },
        },
      },
    });

    const total = await prisma.vendor.count({ where });
    const pages = Math.ceil(total / limit);

    return response.success(
      {
        data: { vendors },
        meta: { total, pages, limit, page },
      },
      {
        message: "Vendors fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getVendor(request: Request, response: Response) {
  try {
    const { id } = getVendorParamsSchema.parse(request.params);
    const {
      page,
      limit,
      sort,
      name,
      minStock,
      minPrice,
      maxPrice,
      isDeleted,
      categoryId,
    } = getVendorQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundResponse("Vendor not found");
      }
    }

    const where: Prisma.ProductWhereInput = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (minStock !== undefined) {
      where.stock = {
        gte: minStock,
      };
    }

    if (minPrice !== undefined) {
      where.price = {
        gte: minPrice,
      };
    }

    if (maxPrice !== undefined) {
      where.price = {
        lte: maxPrice,
      };
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    if (isDeleted !== undefined) {
      where.isDeleted = isDeleted;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        ...vendorSelector.profile,
        auth: {
          select: {
            ...adminSelector.auth,
          },
        },
        products: {
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: {
            ...(sort === "RELEVANCE" && {
              orderToProduct: { _count: "desc" },
            }),
            ...(sort === "LATEST" && { createdAt: "desc" }),
            ...(sort === "OLDEST" && { createdAt: "asc" }),
          },
          select: {
            ...vendorSelector.product,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("Vendor not found");
    }

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Vendor fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateVendor(request: Request, response: Response) {
  try {
    const { id } = updateVendorParamsSchema.parse(request.params);
    const validatedData = updateVendorBodySchema.parse(request.body);

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        auth: {
          update: validatedData,
        },
      },
      select: {
        ...vendorSelector.profile,
        auth: {
          select: {
            ...adminSelector.auth,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("Vendor not found");
    }

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Vendor updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getVendors, getVendor, updateVendor };
