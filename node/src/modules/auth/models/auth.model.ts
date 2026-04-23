import { eq } from "drizzle-orm";
import { type Transaction } from "../../../db/drizzle.client";
import { UnavailableCreateUserError } from "../errors/unavailable-create-user";
import { NicknameAlreadyTaken } from "../errors/nickname-already-taken";
import { tables } from "$app/db/tables";

class AuthModule {
    async createUser(trx: Transaction, data: typeof tables.users.$inferInsert) {
        const [duplicate] = await trx.select().from(tables.users).where(eq(tables.users.username, data.username)).execute();
        if (duplicate) throw new NicknameAlreadyTaken();

        const [user] = await trx.insert(tables.users).values(data).returning().execute();
        if (!user) throw new UnavailableCreateUserError();
        const { password_hash, ...rest } = user;
        return rest;
    }
}

export default new AuthModule();
