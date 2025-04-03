import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getReviewsService } from "~/services/public/reviews";
import {
  getReviewsParamsSchema,
  getReviewsQuerySchema,
} from "~/validators/public/reviews";

async function getReviews(request: Request, response: Response) {
  try {
    const { productId } = getReviewsParamsSchema.parse(request.params);
    const { limit, sort } = getReviewsQuerySchema.parse(request.query);

    const {
      reviews,
      total,
      limit: responseLimit,
    } = await getReviewsService({
      productId,
      limit,
      sort,
    });

    return response.success(
      {
        data: { reviews },
        meta: { total, limit: responseLimit },
      },
      {
        message: "Reviews fetched successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getReviews };
