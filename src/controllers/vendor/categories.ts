import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { suggestCategoryBodySchema } from "~/validators/vendor/categories";

async function suggestCategory(request: Request, response: Response) {
  try {
    const validatedData = suggestCategoryBodySchema.parse(request.body);

    const category = await prisma.category.create({
      data: validatedData,
      select: {
        ...publicSelector.category,
      },
    });

    return response.success(
      {
        data: { category },
      },
      {
        message: "Category suggested successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { suggestCategory };
