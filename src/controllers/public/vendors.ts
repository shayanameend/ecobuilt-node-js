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

    const categoryIds = categoryId
      ? Array.isArray(categoryId)
        ? categoryId
        : [categoryId]
      : [];

    console.log({ categoryIds });

    if (categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          status: "APPROVED",
          isDeleted: false,
        },
        select: { id: true },
      });

      if (categories.length === 0) {
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

    let vendorIds: string[] = [];

    if (categoryIds.length > 0) {
      const vendorsWithProducts = await prisma.vendor.findMany({
        where: {
          auth: {
            status: "APPROVED",
            isVerified: true,
            isDeleted: false,
          },
          products: {
            some: {
              categoryId: { in: categoryIds },
            },
          },
        },
        select: {
          id: true,
          products: {
            where: {
              categoryId: { in: categoryIds },
            },
            select: {
              categoryId: true,
            },
          },
        },
      });

      vendorIds = vendorsWithProducts
        .filter((vendor) => {
          const uniqueCategoryIds = new Set(
            vendor.products.map((product) => product.categoryId),
          );
          return categoryIds.every((catId) => uniqueCategoryIds.has(catId));
        })
        .map((vendor) => vendor.id);

      if (vendorIds.length === 0) {
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

      where.id = { in: vendorIds };
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
      categoryId,
    } = getVendorQuerySchema.parse(request.query);

    const categoryIds = categoryId
      ? Array.isArray(categoryId)
        ? categoryId
        : [categoryId]
      : [];

    if (categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          status: "APPROVED",
          isDeleted: false,
        },
        select: { id: true },
      });

      if (categories.length === 0) {
        throw new NotFoundResponse("Vendor not found");
      }
    }

    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      category: {
        status: "APPROVED",
        isDeleted: false,
      },
      vendor: {
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
      },
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

    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
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
            category: {
              select: {
                ...publicSelector.category,
              },
            },
            vendor: {
              select: {
                ...vendorSelector.profile,
              },
            },
          },
        },
      },
    });

    const total = await prisma.product.count({ where });
    const pages = Math.ceil(total / limit);

    if (!vendor) {
      throw new NotFoundResponse("Vendor not found");
    }

    return response.success(
      {
        data: { vendor },
        meta: { total, pages, limit, page },
      },
      {
        message: "Vendor fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getVendors, getVendor };
