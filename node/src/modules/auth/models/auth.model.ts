import { eq } from "drizzle-orm";
import { type Transaction } from "../../../db/drizzle.client";
import { usersTable } from "../../users/models/users.model";
import { UnavailableCreateUserError } from "../errors/unavailable-create-user";
import { NicknameAlreadyTaken } from "../errors/nickname-already-taken";

class AuthModule {
    async createUser(trx: Transaction, data: typeof usersTable.$inferInsert) {
        const [duplicate] = await trx.select().from(usersTable).where(eq(usersTable.nickname, data.nickname)).execute();
        if (duplicate) throw new NicknameAlreadyTaken();

        const [user] = await trx.insert(usersTable).values(data).returning().execute();
        if (!user) throw new UnavailableCreateUserError();
        const { password_hash, ...rest } = user;
        return rest;
    }
}

export default new AuthModule();
