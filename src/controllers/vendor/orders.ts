import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { BadResponse, NotFoundResponse, handleErrors } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";
import {
  getOrderParamsSchema,
  getOrdersQuerySchema,
  toggleOrderStatusBodySchema,
  toggleOrderStatusParamsSchema,
} from "~/validators/vendor/orders";

async function getOrders(request: Request, response: Response) {
  try {
    const {
      page,
      limit,
      sort,
      status,
      minPrice,
      maxPrice,
      categoryId,
      productId,
    } = getOrdersQuerySchema.parse(request.query);

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      return response.success(
        {
          data: { orders: [] },
          meta: { total: 0, pages: 1, limit, page },
        },
        {
          message: "Orders fetched successfully",
        },
      );
    }

    if (productId) {
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
          vendorId: vendor.id,
        },
        select: { id: true },
      });

      if (!product) {
        return response.success(
          {
            data: { orders: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Orders fetched successfully",
          },
        );
      }
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, status: "APPROVED", isDeleted: false },
        select: { id: true },
      });

      if (!category) {
        return response.success(
          {
            data: { orders: [] },
            meta: { total: 0, pages: 1, limit, page },
          },
          {
            message: "Orders fetched successfully",
          },
        );
      }
    }

    const where: Prisma.OrderWhereInput = {
      orderToProduct: {
        every: {
          product: {
            vendorId: vendor.id,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (minPrice !== undefined) {
      where.totalPrice = {
        gte: minPrice,
      };
    }

    if (maxPrice !== undefined) {
      where.totalPrice = {
        lte: maxPrice,
      };
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      where.totalPrice = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    if (productId) {
      where.orderToProduct = {
        some: {
          productId,
        },
      };
    }

    if (categoryId) {
      where.orderToProduct = {
        some: {
          product: {
            categoryId,
          },
        },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        ...(sort === "LATEST" && { createdAt: "desc" }),
        ...(sort === "OLDEST" && { createdAt: "asc" }),
      },
      select: {
        ...publicSelector.order,
        orderToProduct: {
          select: {
            ...publicSelector.orderToProduct,
            product: {
              select: {
                ...vendorSelector.product,
              },
            },
          },
        },
        user: {
          select: {
            ...userSelector.profile,
          },
        },
      },
    });

    const total = await prisma.order.count({ where });
    const pages = Math.ceil(total / limit);

    return response.success(
      {
        data: { orders },
        meta: { total, pages, limit, page },
      },
      {
        message: "Orders fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function getOrder(request: Request, response: Response) {
  try {
    const { id } = getOrderParamsSchema.parse(request.params);

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new NotFoundResponse("Order not found");
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
        orderToProduct: {
          every: {
            product: {
              vendorId: vendor.id,
            },
          },
        },
      },
      select: {
        ...publicSelector.order,
        orderToProduct: {
          select: {
            ...publicSelector.orderToProduct,
            product: {
              select: {
                ...vendorSelector.product,
                category: {
                  select: {
                    ...publicSelector.category,
                  },
                },
                vendor: {
                  select: {
                    ...vendorSelector.profile,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            ...userSelector.profile,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundResponse("Order not found");
    }

    return response.success(
      {
        data: { order },
      },
      {
        message: "Order fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

async function toggleOrderStatus(request: Request, response: Response) {
  try {
    const { id } = toggleOrderStatusParamsSchema.parse(request.params);
    const { status } = toggleOrderStatusBodySchema.parse(request.body);

    const vendor = await prisma.vendor.findUnique({
      where: { authId: request.user.id },
      select: {
        id: true,
      },
    });

    if (!vendor) {
      throw new BadResponse("Failed to toggle order status");
    }

    const order = await prisma.order.update({
      where: {
        id,
        orderToProduct: {
          every: {
            product: {
              vendorId: vendor.id,
            },
          },
        },
      },
      data: {
        status,
      },
      select: {
        ...publicSelector.order,
        orderToProduct: {
          select: {
            ...publicSelector.orderToProduct,
            product: {
              select: {
                ...vendorSelector.product,
                category: {
                  select: {
                    ...publicSelector.category,
                  },
                },
                vendor: {
                  select: {
                    ...vendorSelector.profile,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            ...userSelector.profile,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundResponse("Order not found");
    }

    return response.success(
      {
        data: { order },
      },
      {
        message: "Order status toggled successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}

export { getOrders, getOrder, toggleOrderStatus };
