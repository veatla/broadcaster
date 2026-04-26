import * as argon2 from "argon2";
import { count, eq, and } from "drizzle-orm";
import { type Transaction } from "../../../db/drizzle.client";
import { UnavailableCreateUserError } from "../errors/unavailable-create-user";
import { UsernameAlreadyTaken } from "../errors/username-already-taken";
import { IncorrectLoginDataError } from "../errors/incorrect-login-data";
import { tables } from "$app/db/tables";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class AuthModule {
    async createUser(trx: Transaction, data: typeof tables.users.$inferInsert) {
        const [duplicate] = await trx.select().from(tables.users).where(eq(tables.users.username, data.username!)).execute();
        if (duplicate) throw new UsernameAlreadyTaken();

        const [user] = await trx.insert(tables.users).values(data).returning().execute();
        if (!user) throw new UnavailableCreateUserError();
        const { password_hash, ...rest } = user;
        return rest;
    }

    async loginUser(trx: Transaction, data: { username: string; password: string }) {
        const [user] = await trx.select().from(tables.users).where(eq(tables.users.username, data.username)).execute();
        if (!user) throw new IncorrectLoginDataError();
        const is_valid = await argon2.verify(user.password_hash, data.password);
        if (!is_valid) throw new IncorrectLoginDataError();
        const { password_hash, ...rest } = user;
        return rest;
    }

    async createSession(trx: Transaction, userId: string): Promise<string> {
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        await trx.insert(tables.userSessions).values({
            id: token,
            user_id: userId,
            expires_at: new Date(Date.now() + SESSION_TTL_MS),
            device_blob: Buffer.alloc(0),
            ip_blob: Buffer.alloc(0),
            location_blob: Buffer.alloc(0),
        });

        return token;
    }

    async deleteSession(trx: Transaction, sessionId: string): Promise<void> {
        await trx.delete(tables.userSessions).where(eq(tables.userSessions.id, sessionId));
    }
}

export default new AuthModule();
