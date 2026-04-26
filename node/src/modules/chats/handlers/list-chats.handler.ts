import { $ } from "$app/core/request";
import db from "$app/db/drizzle.client";
import { tables } from "$app/db/tables";
import { eq, desc, ne, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const listChatsHandler = $(
    async ({ user }) => {
        const otherCm = alias(tables.chatMembers, "other_cm");

        const rows = await db
            .select({
                id: tables.chats.id,
                type: tables.chats.type,
                title: tables.chats.title,
                avatar: tables.chats.avatar,
                created_at: tables.chats.created_at,
                other_user_id: tables.users.id,
                other_username: tables.users.username,
                other_first_name: tables.users.first_name,
                other_last_name: tables.users.last_name,
                other_profile_photo: tables.users.profile_photo,
            })
            .from(tables.chatMembers)
            .innerJoin(tables.chats, eq(tables.chatMembers.chat_id, tables.chats.id))
            .leftJoin(otherCm, and(eq(otherCm.chat_id, tables.chats.id), ne(otherCm.user_id, user.id), eq(tables.chats.type, "private")))
            .leftJoin(tables.users, eq(tables.users.id, otherCm.user_id))
            .where(eq(tables.chatMembers.user_id, user.id))
            .orderBy(desc(tables.chats.created_at));

        return rows;
    },
    { auth: "required" },
);
