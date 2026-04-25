import type { Express } from "express";
import authRouter from "./modules/auth/route";
import messagesRoute from "./modules/messages/route";

const registerAllRoutes = (app: Express) => {
    app.use("/auth", authRouter);
    app.use("/messages", messagesRoute);
};

export { registerAllRoutes };
