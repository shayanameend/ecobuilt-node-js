import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import { getDashboardKPIsService } from "~/services/admin/dashboard";

async function getDashboardKPIs(_request: Request, response: Response) {
  try {
    const {
      vendorsCount,
      productsCount,
      ordersCount,
      usersCount,
      recentOrders,
      recentProducts,
    } = await getDashboardKPIsService();

    return response.success(
      {
        data: {
          vendorsCount,
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
