import z from "zod";
import nacl from "tweetnacl";
import * as argon2 from "argon2";
import AuthModule from "../models/auth.model";
import db from "../../../db/drizzle.client";
import { $ } from "$app/core/request";
import { tables } from "$app/db/tables";

export const userRegisterSchema = z.object({
    nickname: z.string(),
    password: z.string(),
    first_name: z.string(),
    last_name: z.string(),

    identity_public_key: z.string().min(1),
    signed_prekey: z.object({
        keyId: z.number().positive().int(),
        publicKey: z.string().min(1),
    }),
    signature: z.string().min(1),
    one_time_prekeys: z.array(
        z.object({
            keyId: z.bigint().positive(),
            publicKey: z.string().min(1),
        }),
    ),
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

            const isValid = nacl.sign.detached.verify(
                Buffer.from(body.signed_prekey.publicKey, "base64"),
                Buffer.from(body.signature, "base64"),
                Buffer.from(body.identity_public_key, "base64"),
            );

            if (!isValid) throw new Error("Invalid signature");

            const [device] = await trx
                .insert(tables.devices)
                .values({
                    identity_public_key: Buffer.from(body.identity_public_key, "base64"),
                    device_name: "Device",
                    identity_key_fingerprint: Buffer.from(body.signed_prekey.publicKey, "base64"),
                    created_at: new Date(),
                    user_id: user.id,
                    status: "active",
                })
                .returning();

            if (!device) throw new Error("Failed to create device");

            const keysToSave: (typeof tables.deviceSignedPrekeys.$inferInsert)[] = body.one_time_prekeys.map((key) => ({
                device_id: device.id,
                public_key: Buffer.from(key.publicKey, "base64"),
                prekey_id: key.keyId,
                signature: Buffer.from(body.signature, "base64"),
            }));

            await trx.insert(tables.deviceSignedPrekeys).values(keysToSave);
            return { user, deviceId: device.id };
        });

        return result;
    },
    {
        auth: "disabled",
        body: userRegisterSchema,
    },
);
