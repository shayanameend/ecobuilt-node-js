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
  categoryId,
  vendorId,
  productId,
  minTotalPrice,
  maxTotalPrice,
}: {
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  status?: OrderStatus;
  categoryId?: string;
  vendorId?: string;
  productId?: string;
  minTotalPrice?: number;
  maxTotalPrice?: number;
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

  // Add price range filtering
  if (minTotalPrice !== undefined && maxTotalPrice !== undefined) {
    where.totalPrice = {
      gte: minTotalPrice,
      lte: maxTotalPrice,
    };
  } else if (minTotalPrice !== undefined) {
    where.totalPrice = {
      gte: minTotalPrice,
    };
  } else if (maxTotalPrice !== undefined) {
    where.totalPrice = {
      lte: maxTotalPrice,
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
  // Check if the status is CANCELLED or REJECTED, which requires stock restoration
  if (status === "CANCELLED" || status === "REJECTED") {
    // First, get the current order with its products and quantities
    const currentOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        status: true,
        orderToProduct: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!currentOrder) {
      throw new NotFoundResponse("Order not found");
    }

    // Only restore stock if the order is not already cancelled or rejected
    if (
      currentOrder.status !== "CANCELLED" &&
      currentOrder.status !== "REJECTED"
    ) {
      // Use a transaction to update the order status and restore stock
      return await prisma.$transaction(async (tx) => {
        // Update the order status
        const updatedOrder = await tx.order.update({
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

        // Restore stock for each product in the order
        for (const item of currentOrder.orderToProduct) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        return { order: updatedOrder };
      });
    }
  }

  // For other status changes, just update the order status without affecting stock
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
