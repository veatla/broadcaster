import z from "zod";
import { $ } from "../../../lib/request";
import * as argon2 from "argon2";
import AuthModule from "../models/auth.model";
import db from "../../../db/db";

export const userRegisterSchema = z.object({
    nickname: z.string(),
    password: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    public_key: z.string(),
});

export const userRegisterHandler = $(
    async ({ body }) => {
        const hashed_password = await argon2.hash(body.password);
        const user = await db.transaction((trx) =>
            AuthModule.createUser(trx, {
                first_name: body.first_name,
                last_name: body.last_name,
                nickname: body.nickname,
                password_hash: hashed_password,
                public_key: body.public_key,
            }),
        );

        return user;
    },
    {
        authRequired: false,
        body: userRegisterSchema,
    },
);
