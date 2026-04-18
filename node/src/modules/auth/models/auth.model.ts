import { eq } from "drizzle-orm";
import db, { type Transaction } from "../../../db/db";
import { usersTable } from "../../users/models/users.model";
import { APIError } from "../../../lib/errors/api-error";

class AuthModule {
    async createUser(trx: Transaction, data: typeof usersTable.$inferInsert) {
        const [duplicate] = await trx.select().from(usersTable).where(eq(usersTable.nickname, data.nickname)).execute();
        if (duplicate) throw new APIError(`This nickname is already taken!`, 400);

        const [user] = await trx.insert(usersTable).values(data).returning().execute();
        if (!user) throw new APIError(`Unavailable to create user!`, 500);

        const { password_hash, ...rest } = user;
        return rest;
    }
}

export default new AuthModule();
