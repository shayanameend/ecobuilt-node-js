import type { OrderStatus, Prisma } from "@prisma/client";

import { BadResponse, NotFoundResponse } from "~/lib/error";
import { prisma } from "~/lib/prisma";
import { publicSelector } from "~/selectors/public";
import { vendorSelector } from "~/selectors/vendor";

/**
 * Get orders for a user with filters
 */
async function getOrdersService({
  userId,
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
  userId: string;
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
        isDeleted: false,
        category: {
          status: "APPROVED",
          isDeleted: false,
        },
        vendor: {
          auth: {
            status: "APPROVED",
            isVerified: true,
            isDeleted: false,
          },
        },
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
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
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

  const user = await prisma.user.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new NotFoundResponse("Order not found");
  }

  const where: Prisma.OrderWhereInput = {
    userId: user.id,
  };

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

  if (categoryId) {
    where.orderToProduct = {
      some: {
        product: {
          categoryId,
        },
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
              ...publicSelector.product,
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
 * Get a single order for a user
 */
async function getOrderService({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new NotFoundResponse("Order not found");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId: user.id,
    },
    select: {
      ...publicSelector.order,
      orderToProduct: {
        select: {
          ...publicSelector.orderToProduct,
          product: {
            select: {
              ...publicSelector.product,
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
    },
  });

  if (!order) {
    throw new NotFoundResponse("Order not found");
  }

  return { order };
}

/**
 * Create a new order for a user
 */
async function createOrderService({
  userId,
  products: productsForOrder,
}: {
  userId: string;
  products: { productId: string; quantity: number }[];
}) {
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productsForOrder.map((product) => product.productId),
      },
      isDeleted: false,
      category: {
        status: "APPROVED",
        isDeleted: false,
      },
      vendor: {
        auth: {
          status: "APPROVED",
          isVerified: true,
          isDeleted: false,
        },
      },
    },
    select: {
      ...publicSelector.product,
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
  });

  if (products.length !== productsForOrder.length) {
    throw new BadResponse("Failed to create order");
  }

  for (const productForOrder of productsForOrder) {
    const product = products.find((p) => p.id === productForOrder.productId);

    if (product && product.stock < productForOrder.quantity) {
      throw new BadResponse("Failed to create order");
    }
  }

  const vendorIds = new Set(products.map((product) => product.vendor.id));

  if (vendorIds.size > 1) {
    throw new BadResponse("Failed to create order");
  }

  const totalPrice = products.reduce((totalPrice, product) => {
    const productForOrder = productsForOrder.find(
      (productForOrder) => productForOrder.productId === product.id,
    );

    return totalPrice + (productForOrder?.quantity || 1) * product.price;
  }, 0);

  const user = await prisma.user.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new BadResponse("Failed to create order");
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        totalPrice: totalPrice,
      },
      select: {
        ...publicSelector.order,
        orderToProduct: {
          select: {
            ...publicSelector.orderToProduct,
            product: {
              select: {
                ...publicSelector.product,
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
      },
    });

    await tx.orderToProduct.createMany({
      data: products.map((product) => {
        const productForOrder = productsForOrder.find(
          (productForOrder) => productForOrder.productId === product.id,
        );

        if (!productForOrder) {
          throw new BadResponse("Failed to create order");
        }

        return {
          orderId: newOrder.id,
          productId: product.id,
          price: product.price,
          quantity: productForOrder.quantity,
        };
      }),
    });

    for (const productForOrder of productsForOrder) {
      await tx.product.update({
        where: { id: productForOrder.productId },
        data: { stock: { decrement: productForOrder.quantity } },
      });
    }

    return newOrder;
  });

  if (!order) {
    throw new BadResponse("Failed to create order");
  }

  return { order };
}

/**
 * Toggle order status for a user
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
  const user = await prisma.user.findUnique({
    where: { authId: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new BadResponse("Failed to toggle order status");
  }

  // Check if the status is CANCELLED, which requires stock restoration
  if (status === "CANCELLED") {
    // First, get the current order with its products and quantities
    const currentOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: user.id,
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
            userId: user.id,
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
                    ...publicSelector.product,
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
      userId: user.id,
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
              ...publicSelector.product,
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
    },
  });

  if (!order) {
    throw new NotFoundResponse("Order not found");
  }

  return { order };
}

export {
  getOrdersService,
  getOrderService,
  createOrderService,
  toggleOrderStatusService,
};
