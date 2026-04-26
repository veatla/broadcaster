import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import AuthModule from "../models/auth.model";

export const userLoginSchema = z.object({
    nickname: z.string().min(1).max(64),
    password: z.string().min(8).max(128),
});

export const userLoginHandler = $(
    async ({ body }) => {
        return db.transaction(async (trx) => {
            const user = await AuthModule.loginUser(trx, { username: body.nickname, password: body.password });
            const token = await AuthModule.createSession(trx, user.id);
            return { user, token };
        });
    },
    { auth: "disabled", body: userLoginSchema },
);
