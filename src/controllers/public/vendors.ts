import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";
import {
  getVendorParamsSchema,
  getVendorQuerySchema,
  getVendorsQuerySchema,
} from "~/validators/public/vendors";

async function getVendors(request: Request, response: Response) {
  try {
    const { page, limit, sort, name, city, categoryId } =
      getVendorsQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, status: "APPROVED", isDeleted: false },
        select: { id: true },
      });

      if (!category) {
        return response.success(
          {
            data: { vendors: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Vendors fetched successfully!",
          },
        );
      }
    }

    const where: Prisma.VendorWhereInput = {
      auth: {
        status: "APPROVED",
        isVerified: true,
        isDeleted: false,
      },
    };

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
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
            ...publicSelector.auth,
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
        message: "Vendors fetched successfully!",
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
      categoryId,
    } = getVendorQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, status: "APPROVED", isDeleted: false },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundResponse("Vendor not found!");
      }
    }

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
    };

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

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
      },
      select: {
        ...vendorSelector.profile,
        auth: {
          select: {
            ...publicSelector.auth,
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
            ...publicSelector.product,
          },
        },
      },
    });

    const total = await prisma.product.count({ where });
    const pages = Math.ceil(total / limit);

    if (!vendor) {
      throw new NotFoundResponse("Vendor not found!");
    }

    return response.success(
      {
        data: { vendor },
        meta: { total, pages, limit, page },
      },
      {
        message: "Vendor fetched successfully!",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getVendors, getVendor };
