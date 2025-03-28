import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";
import {
  getProductParamsSchema,
  getProductsQuerySchema,
  toggleProductIsDeletedQuerySchema,
  toggleProductIsDeletedParamsSchema,
} from "~/validators/admin/products";

async function getProducts(request: Request, response: Response) {
  try {
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
      vendorId,
    } = getProductsQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        return response.success(
          {
            data: { products: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Products fetched successfully",
          },
        );
      }
    }

    if (vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true },
      });

      if (!vendor) {
        return response.success(
          {
            data: { products: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Products fetched successfully",
          },
        );
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

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const products = await prisma.product.findMany({
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
    });

    const total = await prisma.product.count({ where });
    const pages = Math.ceil(total / limit);

    return response.success(
      {
        data: { products },
        meta: { total, pages, limit, page },
      },
      {
        message: "Products fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getProduct(request: Request, response: Response) {
  try {
    const { id } = getProductParamsSchema.parse(request.params);

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        ...vendorSelector.product,
        category: {
          select: {
            ...adminSelector.category,
          },
        },
        vendor: {
          select: {
            ...vendorSelector.profile,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundResponse("Product not found");
    }

    return response.success(
      {
        data: { product },
      },
      {
        message: "Product fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function toggleProductIsDeleted(request: Request, response: Response) {
  try {
    const { id } = toggleProductIsDeletedParamsSchema.parse(request.params);
    const { isDeleted } = toggleProductIsDeletedQuerySchema.parse(
      request.query,
    );

    const product = await prisma.product.update({
      where: { id },
      data: { isDeleted },
      select: {
        ...vendorSelector.product,
        category: {
          select: {
            ...adminSelector.category,
          },
        },
        vendor: {
          select: {
            ...vendorSelector.profile,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundResponse("Product not found");
    }

    return response.success(
      {
        data: { product },
      },
      {
        message: `Product ${product.isDeleted ? "deleted" : "restored"} successfully!`,
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getProducts, getProduct, toggleProductIsDeleted };
