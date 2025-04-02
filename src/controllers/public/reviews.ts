import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import {
  getReviewsParamsSchema,
  getReviewsQuerySchema,
} from "~/validators/public/reviews";

async function getReviews(request: Request, response: Response) {
  try {
    const { productId } = getReviewsParamsSchema.parse(request.params);
    const { limit, sort } = getReviewsQuerySchema.parse(request.query);

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return response.success(
        {
          data: { reviews: [] },
          meta: { total: 0, limit },
        },
        {
          message: "Reviews fetched successfully",
        },
      );
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

    return response.success(
      {
        data: { reviews },
        meta: { total, limit },
      },
      {
        message: "Reviews fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getReviews };
