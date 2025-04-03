import type { Prisma } from "@prisma/client";

import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";

/**
 * Suggest a new category
 */
async function suggestCategoryService(data: Prisma.CategoryCreateInput) {
  const category = await prisma.category.create({
    data,
    select: {
      ...publicSelector.category,
    },
  });

  return { category };
}

export { suggestCategoryService };
