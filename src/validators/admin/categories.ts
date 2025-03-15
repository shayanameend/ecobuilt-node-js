import { CategoryStatus } from "@prisma/client";

import * as zod from "zod";

const getCategoriesQuerySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string!",
    })
    .min(1, {
      message: "Name must be at least 1 characters long!",
    })
    .optional(),
  status: zod
    .enum(
      [
        CategoryStatus.PENDING,
        CategoryStatus.APPROVED,
        CategoryStatus.REJECTED,
      ],
      {
        message: "Status must be one of 'PENDING', 'APPROVED', or 'REJECTED'!",
      },
    )
    .optional(),
  isDeleted: zod
    .preprocess(
      (val) => (val === "true" ? true : val === "false" ? false : val),
      zod.boolean({
        message: "isDeleted must be a boolean!",
      }),
    )
    .optional(),
});

const createCategoryBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string!",
    })
    .min(3, {
      message: "Name must be at least 3 characters long!",
    })
    .max(255, {
      message: "Name must be at most 255 characters long!",
    }),
  status: zod
    .enum(
      [
        CategoryStatus.PENDING,
        CategoryStatus.APPROVED,
        CategoryStatus.REJECTED,
      ],
      {
        message: "Status must be one of 'PENDING', 'APPROVED', or 'REJECTED'!",
      },
    )
    .default(CategoryStatus.PENDING),
});

const updateCategoryParamsSchema = zod.object({
  id: zod.string({
    message: "ID must be a string!",
  }),
});

const updateCategoryBodySchema = zod.object({
  name: zod
    .string({
      message: "Name must be a string!",
    })
    .min(3, {
      message: "Name must be at least 3 characters long!",
    })
    .max(255, {
      message: "Name must be at most 255 characters long!",
    })
    .optional(),
  status: zod
    .enum(
      [
        CategoryStatus.PENDING,
        CategoryStatus.APPROVED,
        CategoryStatus.REJECTED,
      ],
      {
        message: "Status must be one of 'PENDING', 'APPROVED', or 'REJECTED'!",
      },
    )
    .optional(),
});

const toggleCategoryIsDeletedParamsSchema = zod.object({
  id: zod.string({
    message: "ID must be a string!",
  }),
});

const toggleCategoryIsDeletedBodySchema = zod.object({
  isDeleted: zod.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    zod.boolean({
      message: "isDeleted must be a boolean!",
    }),
  ),
});

export {
  getCategoriesQuerySchema,
  createCategoryBodySchema,
  updateCategoryParamsSchema,
  updateCategoryBodySchema,
  toggleCategoryIsDeletedParamsSchema,
  toggleCategoryIsDeletedBodySchema,
};
