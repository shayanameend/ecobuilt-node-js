import type { CategoryStatus, Prisma } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";

/**
 * Get categories with filters
 */
async function getCategoriesService({
  name,
  status,
  isDeleted,
}: {
  name?: string;
  status?: CategoryStatus;
  isDeleted?: boolean;
}) {
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

  return { categories };
}

/**
 * Create a new category
 */
async function createCategoryService(data: Prisma.CategoryCreateInput) {
  const category = await prisma.category.create({
    data,
    select: {
      ...adminSelector.category,
    },
  });

  return { category };
}

/**
 * Update a category
 */
async function updateCategoryService({
  id,
  data,
}: {
  id: string;
  data: Prisma.CategoryUpdateInput;
}) {
  const category = await prisma.category.update({
    where: { id },
    data,
    select: {
      ...adminSelector.category,
    },
  });

  if (!category) {
    throw new NotFoundResponse("Category not found");
  }

  return { category };
}

/**
 * Toggle category isDeleted status
 */
async function toggleCategoryIsDeletedService({
  id,
  isDeleted,
}: {
  id: string;
  isDeleted: boolean;
}) {
  const category = await prisma.category.update({
    where: { id },
    data: { isDeleted },
    select: {
      ...adminSelector.category,
    },
  });

  if (!category) {
    throw new NotFoundResponse("Category not found");
  }

  return { category };
}

export {
  getCategoriesService,
  createCategoryService,
  updateCategoryService,
  toggleCategoryIsDeletedService,
};
