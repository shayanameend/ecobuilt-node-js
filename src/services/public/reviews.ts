import type { Prisma } from "@prisma/client";

import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";

/**
 * Get reviews for a product
 */
async function getReviewsService({
  productId,
  limit,
  sort,
}: {
  productId: string;
  limit: number;
  sort?: "LATEST" | "OLDEST";
}) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return {
      reviews: [],
      total: 0,
      limit,
    };
  }

  const where: Prisma.ReviewWhereInput = {
    order: {
      orderToProduct: {
        some: {
          product: {
            id: productId,
          },
        },
      },
    },
  };

  const reviews = await prisma.review.findMany({
    where,
    take: limit,
    orderBy: {
      ...(sort === "LATEST" && { createdAt: "desc" }),
      ...(sort === "OLDEST" && { createdAt: "asc" }),
    },
    select: {
      ...publicSelector.review,
    },
  });

  const total = await prisma.review.count({ where });

  return {
    reviews,
    total,
    limit,
  };
}

export { getReviewsService };
