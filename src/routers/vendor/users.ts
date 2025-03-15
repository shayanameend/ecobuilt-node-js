import { Router } from "express";

import { getUser, getUsers } from "~/controllers/vendor/users";

const usersRouter = Router();

usersRouter.get("/", getUsers);

usersRouter.get("/:id", getUser);

export { usersRouter };
