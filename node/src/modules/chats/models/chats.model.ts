import { sql } from "drizzle-orm";
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const chatsTable = pgTable("chats", {
    id: uuid("id")
        .default(sql`uuid_generate_v4()`)
        .primaryKey(),
    avatar: text("avatar"),
    title: text("title").notNull(),
    type: text("type").notNull().$type<"private" | "group" | "channel">(),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

export type ChatsTable = typeof chatsTable.$inferSelect;

export const chatMembersTable = pgTable("chat_members", {
    chat_id: uuid("chat_id").notNull(),
    user_id: uuid("user_id").notNull(),
    role: text("role")
        .notNull()
        .default(sql`'member'`)
        .$type<"owner" | "admin" | "member">(),
    joined_at: timestamp("joined_at")
        .notNull()
        .default(sql`NOW()`),
    manually_unread: boolean("manually_unread").notNull().default(false),
});

export type ChatsMembersTable = typeof chatMembersTable.$inferSelect;
