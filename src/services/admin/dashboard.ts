import { prisma } from "~/lib/prisma";
import { adminSelector } from "~/selectors/admin";
import { publicSelector } from "~/selectors/public";
import { userSelector } from "~/selectors/user";
import { vendorSelector } from "~/selectors/vendor";

async function getDashboardKPIsService() {
  const [
    vendorsCount,
    productsCount,
    ordersCount,
    usersCount,
    recentOrders,
    recentProducts,
  ] = await Promise.all([
    prisma.vendor.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.findMany({
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
    vendorsCount,
    productsCount,
    ordersCount,
    usersCount,
    recentOrders,
    recentProducts,
  };
}

export { getDashboardKPIsService };
