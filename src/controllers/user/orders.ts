import type { Request, Response } from "express";

import { handleErrors } from "~/lib/error";
import {
  createOrderService,
  getOrderService,
  getOrdersService,
  toggleOrderStatusService,
} from "~/services/user/orders";
import {
  createOrderBodySchema,
  getOrderParamsSchema,
  getOrdersQuerySchema,
  toggleOrderStatusBodySchema,
  toggleOrderStatusParamsSchema,
} from "~/validators/user/orders";

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
      userId: request.user.id,
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

async function createOrder(request: Request, response: Response) {
  try {
    const { products } = createOrderBodySchema.parse(request.body);

    const { order } = await createOrderService({
      userId: request.user.id,
      products,
    });

    return response.success(
      {
        data: { order },
      },
      {
        message: "Order created successfully",
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

export { getOrders, getOrder, createOrder, toggleOrderStatus };
