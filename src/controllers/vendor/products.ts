import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  createProductService,
  deleteProductService,
  getProductService,
  getProductsService,
  updateProductService,
} from "~/services/vendor/products";
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

    const {
      products,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getProductsService({
      userId: request.user.id,
      page,
      limit,
      sort,
      name,
      minStock,
      minPrice,
      maxPrice,
      isDeleted,
      categoryId,
    });

    return response.success(
      {
        data: { products },
        meta: { total, pages, limit: responseLimit, page: responsePage },
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

    const { product } = await getProductService({
      userId: request.user.id,
      productId: id,
    });

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

    const { product } = await createProductService({
      userId: request.user.id,
      data: validatedData,
      files: request.files as Express.Multer.File[],
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

    const { product } = await updateProductService({
      userId: request.user.id,
      productId: id,
      data: validatedData,
      files: request.files as Express.Multer.File[] | undefined,
    });

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

    const { product } = await deleteProductService({
      userId: request.user.id,
      productId: id,
    });

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
