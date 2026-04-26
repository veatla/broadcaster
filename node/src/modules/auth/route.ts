import { Router } from "express";
import { userRegisterHandler } from "./handlers/register.handler";
import { userLoginHandler } from "./handlers/login.handler";
import { logoutHandler } from "./handlers/logout.handler";

const authRouter = Router();

authRouter.post("/register", userRegisterHandler);
authRouter.post("/login", userLoginHandler);
authRouter.post("/logout", logoutHandler);

export default authRouter;
