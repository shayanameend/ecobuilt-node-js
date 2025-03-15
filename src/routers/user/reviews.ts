import { Router } from "express";

import { createReview } from "~/controllers/user/reviews";

const reviewsRouter = Router();

reviewsRouter.post("/:orderId", createReview);

export { reviewsRouter };
