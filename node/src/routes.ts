import type { Express } from "express";
import authRouter from "./modules/auth/route";
import messagesRoute from "./modules/messages/route";
import usersRoute from "./modules/users/route";
import chatsRoute from "./modules/chats/route";

const registerAllRoutes = (app: Express) => {
    app.use("/auth", authRouter);
    app.use("/messages", messagesRoute);
    app.use("/users", usersRoute);
    app.use("/chats", chatsRoute);
};

export { registerAllRoutes };
