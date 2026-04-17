import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const stories = pgTable("stories", {
    id: uuid("id")
        .notNull()
        .default(sql`uuid_generate_v4()`),
    author_id: uuid("author_id").notNull(),
    attachment: text("attachment").notNull(),
    caption: text("caption"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at"),
});

export type StoriesTable = typeof stories.$inferSelect;

export const storyViewsTable = pgTable("story_views", {
    story_id: uuid("story_id").notNull(),
    user_id: uuid("user_id").notNull(),
    view_at: timestamp("view_at").notNull().defaultNow(),
    reaction_at: timestamp("reaction_at"),
    reaction: text("reaction"),
});

export type StoryViewsTable = typeof storyViewsTable.$inferSelect;
