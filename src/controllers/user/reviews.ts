import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { createReviewService } from "~/services/user/reviews";
import {
  createReviewBodySchema,
  createReviewParamsSchema,
} from "~/validators/user/reviews";

async function createReview(request: Request, response: Response) {
  try {
    const { orderId } = createReviewParamsSchema.parse(request.params);
    const { rating, comment } = createReviewBodySchema.parse(request.body);

    const { review } = await createReviewService({
      userId: request.user.id,
      orderId,
      rating,
      comment,
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
