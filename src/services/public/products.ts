import type { Prisma } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";

/**
 * Get products with filters
 */
async function getProductsService({
  page,
  limit,
  sort,
  name,
  minStock,
  minPrice,
  maxPrice,
  categoryId,
  vendorId,
}: {
  page: number;
  limit: number;
  sort?: "RELEVANCE" | "LATEST" | "OLDEST";
  name?: string;
  minStock?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  vendorId?: string;
}) {
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
      },
      select: { id: true },
    });

    if (!vendor) {
      return {
        products: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
    }
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, status: "APPROVED", isDeleted: false },
      select: { id: true },
    });

    if (!category) {
      return {
        products: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
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
  });

  const total = await prisma.product.count({ where });
  const pages = Math.ceil(total / limit);

  return {
    products,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single product
 */
async function getProductService({
  productId,
}: {
  productId: string;
}) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      isDeleted: false,
      category: { status: "APPROVED", isDeleted: false },
      vendor: {
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
      },
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
  });

  if (!product) {
    throw new NotFoundResponse("Product not found");
  }

  return { product };
}

export { getProductsService, getProductService };
