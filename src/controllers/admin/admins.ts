import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getAdminService,
  getAdminsService,
  updateAdminService,
} from "~/services/admin/admins";
import {
  getAdminParamsSchema,
  getAdminsQuerySchema,
  updateAdminBodySchema,
  updateAdminParamsSchema,
} from "~/validators/admin/admins";

async function getAdmins(request: Request, response: Response) {
  try {
    const {
      page,
      limit,
      sort,
      email,
      name,
      phone,
      status,
      isVerified,
      isDeleted,
    } = getAdminsQuerySchema.parse(request.query);

    const {
      admins,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getAdminsService({
      userId: request.user.id,
      page,
      limit,
      sort,
      email,
      name,
      phone,
      status,
      isVerified,
      isDeleted,
    });

    return response.success(
      {
        data: { admins },
        meta: { total, pages, limit: responseLimit, page: responsePage },
      },
      {
        message: "Admins fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getAdmin(request: Request, response: Response) {
  try {
    const { id } = getAdminParamsSchema.parse(request.params);

    const { admin } = await getAdminService({
      adminId: id,
    });

    return response.success(
      {
        data: { admin },
      },
      {
        message: "Admin fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateAdmin(request: Request, response: Response) {
  try {
    const { id } = updateAdminParamsSchema.parse(request.params);
    const validatedData = updateAdminBodySchema.parse(request.body);

    const { admin } = await updateAdminService({
      adminId: id,
      data: validatedData,
    });

    return response.success(
      {
        data: { admin },
      },
      {
        message: "Admin updated successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getAdmins, getAdmin, updateAdmin };
