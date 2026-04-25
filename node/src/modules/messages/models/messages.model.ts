import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const messagesTable = pgTable("messages", {
    id: uuid("id")
        .default(sql`uuid_generate_v4()`)
        .primaryKey(),
    chat_id: uuid("chat_id").notNull(),
    sender_id: uuid("sender_id"),
    replied_to: uuid("replied_to"),
    content: text("content"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
});
export type MessagesTable = typeof messagesTable.$inferSelect;

export const messageUserStateTable = pgTable(
    "message_user_state",
    {
        message_id: uuid("message_id").notNull(),
        user_id: uuid("user_id").notNull(),
        deleted_at: timestamp("deleted_at", { withTimezone: true }),
        read_at: timestamp("read_at", { withTimezone: true }),
    },
    (t) => [primaryKey({ columns: [t.message_id, t.user_id] })],
);
export type MessageUserStateTable = typeof messageUserStateTable.$inferSelect;

export const messageReactionsTable = pgTable(
    "message_reactions",
    {
        message_id: uuid("message_id").notNull(),
        user_id: uuid("user_id").notNull(),
        emoji: text("emoji").notNull(),
        created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [primaryKey({ columns: [t.message_id, t.user_id, t.emoji] })],
);
export type MessageReactionsTable = typeof messageReactionsTable.$inferSelect;
