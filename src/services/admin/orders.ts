import type { OrderStatus, Prisma } from "@prisma/client";

import { NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";

/**
 * Get orders with filters for admin
 */
async function getOrdersService({
  page,
  limit,
  sort,
  status,
  minPrice,
  maxPrice,
  categoryId,
  vendorId,
  productId,
}: {
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  status?: OrderStatus;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  vendorId?: string;
  productId?: string;
}) {
  if (productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: { id: true },
    });

    if (!product) {
      return {
        orders: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
    }
  }

  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: { id: true },
    });

    if (!vendor) {
      return {
        orders: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
    }
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        orders: [],
        total: 0,
        pages: 1,
        limit,
        page,
      };
    }
  }

  const where: Prisma.OrderWhereInput = {};

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

  if (vendorId) {
    where.orderToProduct = {
      every: {
        product: {
          vendorId,
        },
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

  return {
    orders,
    total,
    pages,
    limit,
    page,
  };
}

/**
 * Get a single order for admin
 */
async function getOrderService({ orderId }: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
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
                  ...adminSelector.category,
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

  return { order };
}

/**
 * Toggle order status for admin
 */
async function toggleOrderStatusService({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const order = await prisma.order.update({
    where: {
      id: orderId,
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
                  ...adminSelector.category,
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

  return { order };
}

export { getOrdersService, getOrderService, toggleOrderStatusService };
