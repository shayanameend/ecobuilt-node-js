import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { BadResponse, NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";
import { addFile, removeFile } from "~/utils/file";
import {
  createProductBodySchema,
  deleteProductParamsSchema,
  getProductParamsSchema,
  getProductsQuerySchema,
  updateProductBodySchema,
  updateProductParamsSchema,
} from "~/validators/vendor/products";

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
    } = getProductsQuerySchema.parse(request.query);

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, status: "APPROVED", isDeleted: false },
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

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
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

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("Product not found");
    }

    const product = await prisma.product.findUnique({
      where: { id, vendorId: vendor.id },
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

async function createProduct(request: Request, response: Response) {
  try {
    const validatedData = createProductBodySchema.parse(request.body);

    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: validatedData.categoryId,
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

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new BadResponse("Failed to create product");
    }

    if (!request.files) {
      throw new BadResponse("Pictures are required");
    }

    const pictureIds: string[] = [];

    for (const file of request.files as Express.Multer.File[]) {
      const pictureId = addFile({ file });

      pictureIds.push(pictureId);
    }

    const product = await prisma.product.create({
      data: { ...validatedData, pictureIds, vendorId: vendor.id },
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

    return response.success(
      {
        data: { product },
      },
      {
        message: "Product created successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateProduct(request: Request, response: Response) {
  try {
    const { id } = updateProductParamsSchema.parse(request.params);
    const validatedData = updateProductBodySchema.parse(request.body);

    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: validatedData.categoryId,
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

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new BadResponse("Failed to update product");
    }

    for (const pictureId of validatedData.pictureIds) {
      removeFile({ key: pictureId });
    }

    let pictureIds =
      (
        await prisma.product.findUnique({
          where: { id },
          select: {
            pictureIds: true,
          },
        })
      )?.pictureIds ?? [];

    if (request.files) {
      for (const file of request.files as Express.Multer.File[]) {
        const pictureId = addFile({ file });

        pictureIds.push(pictureId);
      }
    }

    pictureIds = pictureIds.filter(
      (pictureId) => !validatedData.pictureIds.includes(pictureId),
    );

    const product = await prisma.product.update({
      where: { id, vendorId: vendor.id },
      data: { ...validatedData, pictureIds },
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

    return response.success(
      {
        data: { product },
      },
      {
        message: "Product updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

const deleteProduct = async (request: Request, response: Response) => {
  try {
    const { id } = deleteProductParamsSchema.parse(request.params);

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("Product not found");
    }

    const product = await prisma.product.update({
      where: { id, vendorId: vendor.id },
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

    return response.success(
      {
        data: { product },
      },
      {
        message: "Product deleted successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
};

export { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
