import { Router } from "express";
import { meHandler } from "./handlers/me.handler";
import { searchUsersHandler } from "./handlers/search-users.handler";

const usersRoute = Router();

usersRoute.get("/me", meHandler);
usersRoute.get("/search", searchUsersHandler);

export default usersRoute;
