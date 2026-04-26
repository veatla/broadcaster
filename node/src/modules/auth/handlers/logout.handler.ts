import { $ } from "$app/core/request";
import AuthModule from "../models/auth.model";
import db from "$app/db/drizzle.client";

export const logoutHandler = $(
    async ({ session }) => {
        await db.transaction((trx) => AuthModule.deleteSession(trx, session.id));
        return { success: true };
    },
    { auth: "required" },
);
