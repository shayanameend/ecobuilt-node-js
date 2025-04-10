import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getDashboardKPIsService } from "~/services/vendor/dashboard";

async function getDashboardKPIs(request: Request, response: Response) {
  try {
    const userId = request.user.id;
    const {
      totalRevenue,
      productsCount,
      ordersCount,
      usersCount,
      recentOrders,
      recentProducts,
    } = await getDashboardKPIsService(userId);

    return response.success(
      {
        data: {
          totalRevenue,
          productsCount,
          ordersCount,
          usersCount,
          recentOrders,
          recentProducts,
        },
      },
      {
        message: "Dashboard fetched successfully",
      },
    );
  } catch (error) {
    handleErrors({ response, error });
  }
}
export { getDashboardKPIs };
