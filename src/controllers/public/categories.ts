import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getCategoriesService } from "~/services/public/categories";

async function getCategories(_request: Request, response: Response) {
  try {
    const { categories } = await getCategoriesService();

    return response.success(
      {
        data: { categories },
      },
      {
        message: "Categories fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getCategories };
