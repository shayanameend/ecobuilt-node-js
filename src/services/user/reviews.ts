import { BadResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";

/**
 * Create a review for an order
 */
async function createReviewService({
  userId,
  orderId,
  rating,
  comment,
}: {
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
}) {
  const user = await prisma.user.findUnique({
    where: { authId: userId },
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
      rating,
      comment,
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

  return { review };
}

export { createReviewService };
