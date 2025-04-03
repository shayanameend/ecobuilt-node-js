import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getProductService,
  getProductsService,
} from "~/services/public/products";
import {
  getProductParamsSchema,
  getProductsQuerySchema,
} from "~/validators/public/products";

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
      categoryId,
      vendorId,
    } = getProductsQuerySchema.parse(request.query);

    const {
      products,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getProductsService({
      page,
      limit,
      sort,
      name,
      minStock,
      minPrice,
      maxPrice,
      categoryId,
      vendorId,
    });

    return response.success(
      {
        data: { products },
        meta: { total, pages, limit: responseLimit, page: responsePage },
      },
      {
        message: "Products fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getProduct(request: Request, response: Response) {
  try {
    const { id } = getProductParamsSchema.parse(request.params);

    const { product } = await getProductService({
      productId: id,
    });

    return response.success(
      {
        data: { product },
      },
      {
        message: "Product fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getProducts, getProduct };
