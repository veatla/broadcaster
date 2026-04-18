import type { Express } from "express";
import authRouter from "./modules/auth/route";

const registerAllRoutes = (app: Express) => {
    app.use("/auth", authRouter);
};

export { registerAllRoutes };
