import { Router } from "express";
import { userRegisterHandler } from "./handlers/register.handler";

const authRouter = Router();

authRouter.post("/register", userRegisterHandler);

export default authRouter;
