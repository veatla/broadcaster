import { $ } from "$app/core/request";
import z from "zod";
import db from "$app/db/drizzle.client";
import { ilike } from "drizzle-orm";
import { tables } from "$app/db/tables";

const querySchema = z.object({
    q: z.string().min(1).max(64),
});

export const searchUsersHandler = $(
    async ({ query }) => {
        const users = await db
            .select({
                id: tables.users.id,
                username: tables.users.username,
                first_name: tables.users.first_name,
                last_name: tables.users.last_name,
                profile_photo: tables.users.profile_photo,
            })
            .from(tables.users)
            .where(ilike(tables.users.username, `%${query.q}%`))
            .limit(20);

        return users;
    },
    { auth: "required", query: querySchema },
);
