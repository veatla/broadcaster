import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import AuthModule from "../models/auth.model";

export const userLoginSchema = z.object({
    nickname: z.string().min(1).max(64),
    password: z.string().min(8).max(128),
    // device_name: z.string().min(1).max(100).optional(),

    // identity_public_key: z.string().min(1),
    // signed_prekey: z.object({
    //     keyId: z.number().positive().int(),
    //     publicKey: z.string().min(1),
    // }),
    // signature: z.string().min(1),
    // one_time_prekeys: z
    //     .array(
    //         z.object({
    //             keyId: z.bigint().positive(),
    //             publicKey: z.string().min(1),
    //         }),
    //     )
    //     .max(100),
});

export const userLoginHandler = $(
    async ({ body }) => {
        const result = await db.transaction(async (trx) => {
            const user = await AuthModule.loginUser(trx, {
                username: body.nickname,
                password: body.password,
            });

            // const { deviceId } = await AuthModule.registerDevice(trx, user.id, {
            //     identity_public_key: body.identity_public_key,
            //     signed_prekey: body.signed_prekey,
            //     signature: body.signature,
            //     one_time_prekeys: body.one_time_prekeys,
            //     device_name: body.device_name,
            // });

            return { user };
        });

        return result;
    },
    {
        auth: "disabled",
        body: userLoginSchema,
    },
);
