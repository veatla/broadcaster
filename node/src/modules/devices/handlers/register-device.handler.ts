import z from "zod";
import * as argon2 from "argon2";
import db from "../../../db/drizzle.client";
import { $ } from "$app/core/request";

export const deviceRegisterSchema = z.object({
    identity_public_key: z.string().min(1),
    signed_prekey: z.object({
        keyId: z.number().positive().int(),
        publicKey: z.string().min(1),
    }),
    signature: z.string().min(1),
    one_time_prekeys: z.string().min(1),
});

export const deviceRegisterHandler = $(
    async ({ body }) => {
        // const user = await db.transaction((trx) => {
        //     const userId = await
        // });
        return {};
        // return user;
    },
    {
        auth: "disabled",
        body: deviceRegisterSchema,
    },
);
