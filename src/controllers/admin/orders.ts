import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getOrderService,
  getOrdersService,
  toggleOrderStatusService,
} from "~/services/admin/orders";
import {
  getOrderParamsSchema,
  getOrdersQuerySchema,
  toggleOrderStatusBodySchema,
  toggleOrderStatusParamsSchema,
} from "~/validators/admin/orders";

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
      vendorId,
      productId,
    } = getOrdersQuerySchema.parse(request.query);

    const {
      orders,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getOrdersService({
      page,
      limit,
      sort,
      status,
      minPrice,
      maxPrice,
      categoryId,
      vendorId,
      productId,
    });

    return response.success(
      {
        data: { orders },
        meta: { total, pages, limit: responseLimit, page: responsePage },
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

    const { order } = await getOrderService({
      orderId: id,
    });

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

    const { order } = await toggleOrderStatusService({
      orderId: id,
      status,
    });

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
