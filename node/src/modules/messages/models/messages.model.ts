import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "../../users/models/users.model";
import { chats } from "../../chats/models/chats.model";

export const messages = pgTable("messages", {
  id: uuid("id").notNull().default(sql`uuid_generate_v4()`),
  chat_id: uuid("chat_id").notNull().references(() => chats.id, { onDelete: 'cascade' }),
  sender_id: uuid("sender_id").references(() => users.id, { onDelete: 'set null' }),
  replied_to: uuid("replied_to"),
  content: text("content"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at"),
}, (table) => [
  foreignKey({ columns: [table.replied_to], foreignColumns: [table.id] }).onDelete('set null')
]);

export const message_reads = pgTable("message_reads", {
  message_id: uuid("message_id").notNull().references(() => messages.id, { onDelete: 'cascade' }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  read_at: timestamp("read_at").notNull().defaultNow(),
});

export const message_reactions = pgTable("message_reactions", {
  message_id: uuid("message_id").notNull().references(() => messages.id, { onDelete: 'cascade' }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.user_id, table.message_id, table.emoji] })]);
