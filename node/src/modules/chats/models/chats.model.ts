import { sql } from "drizzle-orm";
import {
    pgTable,
    uuid,
    text,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";
import { users } from "../../users/models/users.model";

export const chats = pgTable("chats", {
    id: uuid("id").notNull().default(sql`uuid_generate_v4()`).primaryKey(),
    avatar: text("avatar"),
    title: text("title").notNull(),
    type: text("type").notNull().$type<'private' | 'group' | 'channel'>(),

    // Только для type = 'private': денормализованная пара участников для уникального индекса
    user1_id: uuid("user1_id").references(() => users.id),
    user2_id: uuid("user2_id").references(() => users.id),

    created_at: timestamp("created_at").notNull().defaultNow(),
});

export const chat_members = pgTable("chat_members", {
    chat_id: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
    user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default(sql`'member'`).$type<'owner' | 'admin' | 'member'>(),
    joined_at: timestamp("joined_at").notNull().default(sql`NOW()`),
    manually_unread: boolean("manually_unread").notNull().default(false),
});
