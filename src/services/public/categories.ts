import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";

/**
 * Get all approved and non-deleted categories
 */
async function getCategoriesService() {
  const categories = await prisma.category.findMany({
    where: {
      status: "APPROVED",
      isDeleted: false,
    },
    select: {
      ...publicSelector.category,
    },
  });

  return { categories };
}

export { getCategoriesService };
