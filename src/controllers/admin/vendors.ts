import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getVendorService,
  getVendorsService,
  updateVendorService,
} from "~/services/admin/vendors";
import {
  getVendorParamsSchema,
  getVendorQuerySchema,
  getVendorsQuerySchema,
  updateVendorBodySchema,
  updateVendorParamsSchema,
} from "~/validators/admin/vendors";

async function getVendors(request: Request, response: Response) {
  try {
    const {
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
    } = getVendorsQuerySchema.parse(request.query);

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
      isDeleted,
      categoryId,
    } = getVendorQuerySchema.parse(request.query);

    const { vendor } = await getVendorService({
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
    });

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Vendor fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateVendor(request: Request, response: Response) {
  try {
    const { id } = updateVendorParamsSchema.parse(request.params);
    const validatedData = updateVendorBodySchema.parse(request.body);

    const { vendor } = await updateVendorService({
      id,
      data: validatedData,
    });

    return response.success(
      {
        data: { vendor },
      },
      {
        message: "Vendor updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getVendors, getVendor, updateVendor };
