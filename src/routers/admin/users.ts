import { Router } from "express";

import { getUser, getUsers, updateUser } from "~/controllers/admin/users";

const usersRouter = Router();

usersRouter.get("/", getUsers);

usersRouter.get("/:id", getUser);

usersRouter.put("/:id", updateUser);

export { usersRouter };
