import { Router } from "express";

import { getReviews } from "~/controllers/public/reviews";

const reviewsRouter = Router();

reviewsRouter.get("/:productId", getReviews);

export { reviewsRouter };
