import z from "zod";
import * as argon2 from "argon2";
import AuthModule from "../models/auth.model";
import db from "../../../db/drizzle.client";
import { $ } from "$app/core/request";

export const userRegisterSchema = z.object({
    username: z.string().min(1).max(64),
    password: z.string().min(8).max(128),
    first_name: z.string().min(1).max(64),
    last_name: z.string().min(1).max(64),
});

export const userRegisterHandler = $(
    async ({ body }) => {
        const hashed_password = await argon2.hash(body.password);
        return db.transaction(async (trx) => {
            const user = await AuthModule.createUser(trx, {
                first_name: body.first_name,
                last_name: body.last_name,
                username: body.username,
                password_hash: hashed_password,
            });
            const token = await AuthModule.createSession(trx, user.id);
            return { user, token };
        });
    },
    { auth: "disabled", body: userRegisterSchema },
);
