import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "../../users/models/users.model";
import { attachments } from "../../attachments/models/attachments.model";

export const stories = pgTable("stories", {
  id: uuid().notNull().default(sql`uuid_generate_v4()`),
  author_id: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
  attachment: text().notNull().references(() => attachments.id, { onDelete: 'cascade' }),
  caption: text(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp(),
});


export const story_views = pgTable("story_views", {
  story_id: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  view_at: timestamp("view_at").notNull().defaultNow(),
  reaction_at: timestamp("reaction_at"),
  reaction: text("reaction"),
}, (table) => [
  primaryKey({ columns: [table.story_id, table.user_id] })
]);
