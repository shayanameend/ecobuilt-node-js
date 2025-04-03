import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getVendorService, getVendorsService } from "~/services/public/vendors";
import {
  getVendorParamsSchema,
  getVendorQuerySchema,
  getVendorsQuerySchema,
} from "~/validators/public/vendors";

async function getVendors(request: Request, response: Response) {
  try {
    const { page, limit, sort, name, city, categoryId } =
      getVendorsQuerySchema.parse(request.query);

    const {
      vendors,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getVendorsService({
      page,
      limit,
      sort,
      name,
      city,
      categoryId,
    });

    return response.success(
      {
        data: { vendors },
        meta: { total, pages, limit: responseLimit, page: responsePage },
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

    const {
      vendor,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getVendorService({
      id,
      page,
      limit,
      sort,
      name,
      minStock,
      minPrice,
      maxPrice,
      categoryId,
    });

    return response.success(
      {
        data: { vendor },
        meta: { total, pages, limit: responseLimit, page: responsePage },
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
