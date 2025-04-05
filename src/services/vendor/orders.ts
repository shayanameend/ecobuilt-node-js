import type { OrderStatus, Prisma } from "@prisma/client";

import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";

/**
 * Get orders for a vendor with filters
 */
async function getOrdersService({
  userId,
  page,
  limit,
  sort,
  status,
  categoryId,
  userName,
  productName,
  minTotalPrice,
  maxTotalPrice,
}: {
  userId: string;
  page: number;
  limit: number;
  sort?: "LATEST" | "OLDEST";
  status?: OrderStatus;
  categoryId?: string;
  userName?: string;
  productName?: string;
  minTotalPrice?: number;
  maxTotalPrice?: number;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
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

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId, status: "APPROVED", isDeleted: false },
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

  if (minTotalPrice !== undefined) {
    where.totalPrice = {
      gte: minTotalPrice,
    };
  }

  if (maxTotalPrice !== undefined) {
    where.totalPrice = {
      lte: maxTotalPrice,
    };
  }

  if (minTotalPrice !== undefined && maxTotalPrice !== undefined) {
    where.totalPrice = {
      gte: minTotalPrice,
      lte: maxTotalPrice,
    };
  }

  if (productName) {
    where.orderToProduct = {
      some: {
        product: {
          name: {
            contains: productName,
            mode: "insensitive",
          },
        },
      },
    };
  }

  if (userName) {
    where.user = {
      name: {
        contains: userName,
        mode: "insensitive",
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
 * Get a single order for a vendor
 */
async function getOrderService({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new NotFoundResponse("Order not found");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
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

  return { order };
}

/**
 * Toggle order status for a vendor
 */
async function toggleOrderStatusService({
  userId,
  orderId,
  status,
}: {
  userId: string;
  orderId: string;
  status: OrderStatus;
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new BadResponse("Failed to toggle order status");
  }

  // Check if the status is REJECTED, which requires stock restoration
  if (status === "REJECTED") {
    // First, get the current order with its products and quantities
    const currentOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
        orderToProduct: {
          every: {
            product: {
              vendorId: vendor.id,
            },
          },
        },
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

  return { order };
}

export { getOrdersService, getOrderService, toggleOrderStatusService };
