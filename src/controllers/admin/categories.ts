import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  createCategoryService,
  getCategoriesService,
  toggleCategoryIsDeletedService,
  updateCategoryService,
} from "~/services/admin/categories";
import {
  createCategoryBodySchema,
  getCategoriesQuerySchema,
  toggleCategoryIsDeletedParamsSchema,
  toggleCategoryIsDeletedQuerySchema,
  updateCategoryBodySchema,
  updateCategoryParamsSchema,
} from "~/validators/admin/categories";

async function getCategories(request: Request, response: Response) {
  try {
    const { name, status, isDeleted } = getCategoriesQuerySchema.parse(
      request.query,
    );

    const { categories } = await getCategoriesService({
      name,
      status,
      isDeleted,
    });

    return response.success(
      {
        data: { categories },
      },
      {
        message: "Categories fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function createCategory(request: Request, response: Response) {
  try {
    const validatedData = createCategoryBodySchema.parse(request.body);

    const { category } = await createCategoryService(validatedData);

    return response.success(
      {
        data: { category },
      },
      {
        message: "Category created successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function updateCategory(request: Request, response: Response) {
  try {
    const { id } = updateCategoryParamsSchema.parse(request.params);
    const validatedData = updateCategoryBodySchema.parse(request.body);

    const { category } = await updateCategoryService({
      id,
      data: validatedData,
    });

    return response.success(
      {
        data: { category },
      },
      {
        message: "Category updated successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function toggleCategoryIsDeleted(request: Request, response: Response) {
  try {
    const { id } = toggleCategoryIsDeletedParamsSchema.parse(request.params);
    const { isDeleted } = toggleCategoryIsDeletedQuerySchema.parse(
      request.query,
    );

    const { category } = await toggleCategoryIsDeletedService({
      id,
      isDeleted,
    });

    return response.success(
      {
        data: { category },
      },
      {
        message: `Category ${
          category.isDeleted ? "deleted" : "restored"
        } successfully!`,
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryIsDeleted,
};
