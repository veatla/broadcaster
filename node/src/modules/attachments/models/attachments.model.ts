import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "../../users/models/users.model";
import { chats } from "../../chats/models/chats.model";
import { messages } from "../../messages/models/messages.model";

export const attachments = pgTable("attachments", {
  id: text("id").primaryKey(),
  message_id: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  chat_id: uuid("chat_id").references(() => chats.id, { onDelete: 'cascade' }),
  author_id: uuid("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at"),
});
