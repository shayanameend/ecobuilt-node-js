import type { Prisma } from "@prisma/client";

import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";
import { addFile, removeFile } from "~/utils/file";

/**
 * Get products with filters for a vendor
 */
async function getProductsService({
  userId,
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
  userId: string;
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
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
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
    vendorId: vendor.id,
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

  if (isDeleted !== undefined) {
    where.isDeleted = isDeleted;
  }

  if (categoryId) {
    where.categoryId = categoryId;
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

  return {
    products,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single product for a vendor
 */
async function getProductService({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Product not found");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, vendorId: vendor.id },
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

  if (!product) {
    throw new NotFoundResponse("Product not found");
  }

  return { product };
}

/**
 * Create a new product for a vendor
 */
async function createProductService({
  userId,
  data,
  files,
}: {
  userId: string;
  data: any;
  files?: Express.Multer.File[];
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new BadResponse("Failed to create product");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
        status: "APPROVED",
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new BadResponse("Failed to create product");
    }
  }

  if (!files) {
    throw new BadResponse("Pictures are required");
  }

  const pictureIds: string[] = [];

  if (files && Array.isArray(files)) {
    for (const file of files) {
      const pictureId = await addFile({ file });
      pictureIds.push(pictureId);
    }
  }

  const product = await prisma.product.create({
    data: { ...data, pictureIds, vendorId: vendor.id },
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

  return { product };
}

/**
 * Update a product for a vendor
 */
async function updateProductService({
  userId,
  productId,
  data,
  files,
}: {
  userId: string;
  productId: string;
  data: any;
  files?: Express.Multer.File[];
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new BadResponse("Failed to update product");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
        status: "APPROVED",
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new BadResponse("Failed to update product");
    }
  }

  if (data.pictureIds && Array.isArray(data.pictureIds)) {
    for (const pictureId of data.pictureIds) {
      await removeFile({ key: pictureId });
    }
  }

  let pictureIds =
    (
      await prisma.product.findUnique({
        where: { id: productId },
        select: {
          pictureIds: true,
        },
      })
    )?.pictureIds ?? [];

  if (files && Array.isArray(files)) {
    for (const file of files) {
      const pictureId = await addFile({ file });
      pictureIds.push(pictureId);
    }
  }

  if (data.pictureIds && Array.isArray(data.pictureIds)) {
    pictureIds = pictureIds.filter(
      (pictureId) => !data.pictureIds.includes(pictureId),
    );
  }

  const product = await prisma.product.update({
    where: { id: productId, vendorId: vendor.id },
    data: { ...data, pictureIds },
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

  if (!product) {
    throw new NotFoundResponse("Product not found");
  }

  return { product };
}

/**
 * Delete a product (soft delete) for a vendor
 */
async function deleteProductService({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Product not found");
  }

  const product = await prisma.product.update({
    where: { id: productId, vendorId: vendor.id },
    data: { isDeleted: true },
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

  if (!product) {
    throw new NotFoundResponse("Product not found");
  }

  return { product };
}

export {
  getProductsService,
  getProductService,
  createProductService,
  updateProductService,
  deleteProductService,
};
