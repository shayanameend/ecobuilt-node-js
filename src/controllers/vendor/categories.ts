import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { suggestCategoryService } from "~/services/vendor/categories";
import { suggestCategoryBodySchema } from "~/validators/vendor/categories";

async function suggestCategory(request: Request, response: Response) {
  try {
    const validatedData = suggestCategoryBodySchema.parse(request.body);

    const { category } = await suggestCategoryService(validatedData);

    return response.success(
      {
        data: { category },
      },
      {
        message: "Category suggested successfully",
      }
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { suggestCategory };
