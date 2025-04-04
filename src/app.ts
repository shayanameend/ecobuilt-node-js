import type { NextFunction, Request, Response } from "express";

import cors from "cors";
import express from "express";
import morgan from "morgan";

import { verifyRequest } from "~/middlewares/auth";
import { expandResponse } from "~/middlewares/response";
import { adminRouter } from "~/routers/admin";
import { adminsRouter } from "~/routers/admin/admins";
import { paymentRouter } from "~/routers/payment";
import { publicRouter } from "~/routers/public";
import { userRouter } from "~/routers/user";
import { vendorRouter } from "~/routers/vendor";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expandResponse);

app.use("/", publicRouter);
app.use("/payment", paymentRouter);

app.use(
  "/admin/admins",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["SUPER_ADMIN"],
  }),
  adminsRouter,
);

app.use(
  "/admin",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  }),
  adminRouter,
);

app.use(
  "/vendor",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["VENDOR"],
  }),
  vendorRouter,
);

app.use(
  "/user",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
    allowedRoles: ["USER"],
  }),
  userRouter,
);

app.get(
  "/test",
  verifyRequest({
    isVerified: true,
    isDeleted: false,
    allowedTypes: ["ACCESS"],
    allowedStatus: ["APPROVED"],
  }),
  (_request, response) => {
    response.success({}, { message: "Test route" });
  },
);

app.all("*", (_request, response) => {
  response.notFound({}, { message: "Not Found" });
});

app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);

    response.internalServerError({}, { message: "Internal Server Error" });
  },
);

export { app };
