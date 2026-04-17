import z from "zod";
import { $ } from "../../../lib/request";
import * as argon2 from "argon2";

export const userRegisterSchema = z.object({
    nickname: z.string(),
    password: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    public_key: z.string(),
});

export const userRegisterHandler = $(
    async ({ body }) => {
        const hashed = await argon2.hash(body.password);
        return;
    },
    {
        authRequired: false,
        body: userRegisterSchema,
    },
);
