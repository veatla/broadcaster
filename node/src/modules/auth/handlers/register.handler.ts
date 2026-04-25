import z from "zod";
import * as argon2 from "argon2";
import AuthModule from "../models/auth.model";
import db from "../../../db/drizzle.client";
import { $ } from "$app/core/request";

export const userRegisterSchema = z.object({
    nickname: z.string().min(1).max(64),
    password: z.string().min(8).max(128),
    first_name: z.string().min(1).max(64),
    last_name: z.string().min(1).max(64),
    // device_name: z.string().min(1).max(100).optional(),

    // identity_public_key: z.string().min(1),
    // signed_prekey: z.object({
    //     keyId: z.number().positive().int(),
    //     publicKey: z.string().min(1),
    // }),
    // signature: z.string().min(1),
    // one_time_prekeys: z.array(
    //     z.object({
    //         keyId: z.bigint().positive(),
    //         publicKey: z.string().min(1),
    //     }),
    // ).max(100),
});

export const userRegisterHandler = $(
    async ({ body }) => {
        const hashed_password = await argon2.hash(body.password);
        const result = await db.transaction(async (trx) => {
            const user = await AuthModule.createUser(trx, {
                first_name: body.first_name,
                last_name: body.last_name,
                username: body.nickname,
                password_hash: hashed_password,
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
        body: userRegisterSchema,
    },
);
