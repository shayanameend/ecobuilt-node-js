import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  getOrderService,
  getOrdersService,
  toggleOrderStatusService,
} from "~/services/vendor/orders";
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
      categoryId,
      userName,
      productName,
      minTotalPrice,
      maxTotalPrice,
    } = getOrdersQuerySchema.parse(request.query);

    const {
      orders,
      total,
      pages,
      limit: responseLimit,
      page: responsePage,
    } = await getOrdersService({
      userId: request.user.id,
      page,
      limit,
      sort,
      status,
      categoryId,
      userName,
      productName,
      minTotalPrice,
      maxTotalPrice,
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
      userId: request.user.id,
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
      userId: request.user.id,
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
