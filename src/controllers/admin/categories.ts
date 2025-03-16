import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import {
  createCategoryBodySchema,
  getCategoriesQuerySchema,
  toggleCategoryIsDeletedBodySchema,
  toggleCategoryIsDeletedParamsSchema,
  updateCategoryBodySchema,
  updateCategoryParamsSchema,
} from "~/validators/admin/categories";

async function getCategories(request: Request, response: Response) {
  try {
    const { name, status, isDeleted } = getCategoriesQuerySchema.parse(
      request.query,
    );

    const where: Prisma.CategoryWhereInput = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = status;
    }

    if (isDeleted !== undefined) {
      where.isDeleted = isDeleted;
    }

    const categories = await prisma.category.findMany({
      where,
      select: {
        ...adminSelector.category,
      },
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

    const category = await prisma.category.create({
      data: validatedData,
      select: {
        ...adminSelector.category,
      },
    });

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

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
      select: {
        ...adminSelector.category,
      },
    });

    if (!category) {
      throw new NotFoundResponse("Category not found");
    }

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
    const validatedData = toggleCategoryIsDeletedBodySchema.parse(request.body);

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
      select: {
        ...adminSelector.category,
      },
    });

    if (!category) {
      throw new NotFoundResponse("Category not found");
    }

    return response.success(
      {
        data: { category },
      },
      {
        message: `Category ${category.isDeleted ? "deleted" : "restored"} successfully!`,
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
