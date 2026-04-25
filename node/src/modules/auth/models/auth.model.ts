import nacl from "tweetnacl";
import * as argon2 from "argon2";
import { count, eq, and } from "drizzle-orm";
import { type Transaction } from "../../../db/drizzle.client";
import { UnavailableCreateUserError } from "../errors/unavailable-create-user";
import { NicknameAlreadyTaken } from "../errors/nickname-already-taken";
import { DeviceLimitExceededError } from "../errors/device-limit-exceeded";
import { tables } from "$app/db/tables";
import { IncorrectLoginDataError } from "../errors/incorrect-login-data";

const DEVICE_LIMIT = 5;

export interface DeviceKeys {
    identity_public_key: string;
    signed_prekey: { keyId: number; publicKey: string };
    signature: string;
    one_time_prekeys: Array<{ keyId: bigint; publicKey: string }>;
    device_name?: string;
}

class AuthModule {
    async createUser(trx: Transaction, data: typeof tables.users.$inferInsert) {
        const [duplicate] = await trx.select().from(tables.users).where(eq(tables.users.username, data.username)).execute();
        if (duplicate) throw new NicknameAlreadyTaken();

        const [user] = await trx.insert(tables.users).values(data).returning().execute();
        if (!user) throw new UnavailableCreateUserError();
        const { password_hash, ...rest } = user;
        return rest;
    }
    async loginUser(
        trx: Transaction,
        data: {
            username: string;
            password: string;
        },
    ) {
        const [user] = await trx.select().from(tables.users).where(eq(tables.users.username, data.username)).execute();
        if (!user) throw new IncorrectLoginDataError();
        const is_valid = await argon2.verify(user.password_hash, data.password);
        if (!is_valid) throw new IncorrectLoginDataError();
        const { password_hash, ...rest } = user;
        return rest;
    }

    async e2eeRegisterDevice(trx: Transaction, userId: string, keys: DeviceKeys) {
        const [row] = await trx
            .select({ value: count() })
            .from(tables.devices)
            .where(and(eq(tables.devices.user_id, userId), eq(tables.devices.status, "active")));

        if (Number(row?.value ?? 0) >= DEVICE_LIMIT) throw new DeviceLimitExceededError();

        const isValid = nacl.sign.detached.verify(
            Buffer.from(keys.signed_prekey.publicKey, "base64"),
            Buffer.from(keys.signature, "base64"),
            Buffer.from(keys.identity_public_key, "base64"),
        );
        if (!isValid) throw new Error("Invalid signature");

        const [device] = await trx
            .insert(tables.devices)
            .values({
                identity_public_key: Buffer.from(keys.identity_public_key, "base64"),
                identity_key_fingerprint: Buffer.from(keys.signed_prekey.publicKey, "base64"),
                device_name: keys.device_name ?? "Device",
                user_id: userId,
                status: "active",
                created_at: new Date(),
            })
            .returning();

        if (!device) throw new UnavailableCreateUserError();

        await trx.insert(tables.deviceSignedPrekeys).values({
            device_id: device.id,
            prekey_id: BigInt(keys.signed_prekey.keyId),
            public_key: Buffer.from(keys.signed_prekey.publicKey, "base64"),
            signature: Buffer.from(keys.signature, "base64"),
        });

        if (keys.one_time_prekeys.length > 0) {
            await trx.insert(tables.deviceOneTimePrekeys).values(
                keys.one_time_prekeys.map((key) => ({
                    device_id: device.id,
                    prekey_id: key.keyId,
                    public_key: Buffer.from(key.publicKey, "base64"),
                })),
            );
        }

        return { deviceId: device.id };
    }
}

export default new AuthModule();
