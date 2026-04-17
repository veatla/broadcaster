import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const messagesTable = pgTable("messages", {
    id: uuid("id")
        .default(sql`uuid_generate_v4()`)
        .primaryKey(),
    chat_id: uuid("chat_id").notNull(),
    sender_id: uuid("sender_id"),
    replied_to: uuid("replied_to"),
    content: text("content"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at"),
});
export type MessagesTable = typeof messagesTable.$inferSelect;

export const messageReadsTable = pgTable("message_reads", {
    message_id: uuid("message_id").notNull(),
    user_id: uuid("user_id").notNull(),
    read_at: timestamp("read_at").notNull().defaultNow(),
});
export type MessageReadsTable = typeof messageReadsTable.$inferSelect;

export const messageReactionsTable = pgTable("message_reactions", {
    message_id: uuid("message_id").notNull(),
    user_id: uuid("user_id").notNull(),
    emoji: text("emoji").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

export type MessageReactionsTable = typeof messageReactionsTable.$inferSelect;
