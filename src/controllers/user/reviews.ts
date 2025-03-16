import type { Request, Response } from "express";

import { BadResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import {
  createReviewBodySchema,
  createReviewParamsSchema,
} from "~/validators/user/reviews";

async function createReview(request: Request, response: Response) {
  try {
    const { orderId } = createReviewParamsSchema.parse(request.params);
    const validatedData = createReviewBodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadResponse("Failed to create review");
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new BadResponse("Failed to create review");
    }

    const review = await prisma.review.create({
      data: {
        ...validatedData,
        order: {
          connect: {
            id: orderId,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      select: {
        ...publicSelector.review,
      },
    });

    return response.success(
      {
        data: { review },
      },
      {
        message: "Review created successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { createReview };
