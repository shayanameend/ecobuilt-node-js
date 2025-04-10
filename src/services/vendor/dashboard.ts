import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";

async function getDashboardKPIsService(userId: string) {
  const [
    totalRevenue,
    productsCount,
    ordersCount,
    usersCount,
    recentOrders,
    recentProducts,
  ] = await Promise.all([
    (
      await prisma.order.aggregate({
        where: {
          status: {
            notIn: ["PENDING", "REJECTED", "CANCELLED"],
          },
          orderToProduct: {
            some: {
              product: {
                vendor: {
                  authId: userId,
                },
              },
            },
          },
        },
        _sum: {
          totalPrice: true,
        },
      })
    )._sum.totalPrice || 0,
    prisma.product.count({
      where: {
        vendor: {
          authId: userId,
        },
      },
    }),
    prisma.order.count({
      where: {
        orderToProduct: {
          some: {
            product: {
              vendor: {
                authId: userId,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        orders: {
          some: {
            orderToProduct: {
              some: {
                product: {
                  vendor: {
                    authId: userId,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        orderToProduct: {
          some: {
            product: {
              vendor: {
                authId: userId,
              },
            },
          },
        },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
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
    }),
    prisma.product.findMany({
      where: {
        vendor: {
          authId: userId,
        },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
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
    }),
  ]);

  return {
    productsCount,
    ordersCount,
    usersCount,
    recentOrders,
    recentProducts,
    totalRevenue,
  };
}

export { getDashboardKPIsService };
