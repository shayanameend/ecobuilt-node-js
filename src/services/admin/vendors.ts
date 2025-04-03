import type { Prisma, UserStatus } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { vendorSelector } from "~/selectors/vendor";

/**
 * Get vendors with filters
 */
async function getVendorsService({
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
}: {
  page: number;
  limit: number;
  sort?: "RELEVANCE" | "LATEST" | "OLDEST";
  email?: string;
  name?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  pickupAddress?: string;
  status?: UserStatus;
  isVerified?: boolean;
  isDeleted?: boolean;
  categoryId?: string;
}) {
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        vendors: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
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

  return {
    vendors,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single vendor with their products
 */
async function getVendorService({
  id,
  page,
  limit,
  sort,
  name,
  minStock,
  minPrice,
  maxPrice,
  isDeleted,
  categoryId,
}: {
  id: string;
  page: number;
  limit: number;
  sort?: "RELEVANCE" | "LATEST" | "OLDEST";
  name?: string;
  minStock?: number;
  minPrice?: number;
  maxPrice?: number;
  isDeleted?: boolean;
  categoryId?: string;
}) {
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
      },
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Vendor not found");
  }

  return { vendor };
}

/**
 * Update a vendor's auth information
 */
async function updateVendorService({
  id,
  data,
}: {
  id: string;
  data: Prisma.AuthUpdateInput;
}) {
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      auth: {
        update: data,
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

  return { vendor };
}

export { getVendorsService, getVendorService, updateVendorService };
