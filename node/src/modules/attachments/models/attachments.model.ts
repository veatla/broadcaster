import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const attachmentsTable = pgTable("attachments", {
    id: text("id").primaryKey(),
    message_id: uuid("message_id"),
    chat_id: uuid("chat_id"),
    author_id: uuid("author_id").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at"),
});

export type AttachmentsTable = typeof attachmentsTable.$inferSelect;
