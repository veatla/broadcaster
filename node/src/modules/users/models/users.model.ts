import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  bigint,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { bytea } from "../../../db/db";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  nickname: text("nickname").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  public_key: text("public_key"),
  profile_photo: text("profile_photo"),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  bio: text("bio"),
  privacy_flags: bigint("privacy_flags", { mode: "bigint" })
    .notNull()
    .default(sql`0`),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`NOW()`),
  updated_at: timestamp("updated_at"),
  deactivated_at: timestamp("deactivated_at"),
  last_seen: timestamp("last_seen"),
  online: boolean("online"),
});

export const user_settings = pgTable("user_settings", {
  user_id: uuid("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferred_language: text("preferred_language").notNull().default("en"),
});
export type Privacy = "everyone" | "contacts" | "nobody"
export const user_privacy = pgTable("user_privacy", {
  user_id: uuid("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  last_seen: text("last_seen").$type<Privacy>().default(sql`'everyone'`),
  online: text("online").$type<Privacy>().default(sql`'everyone'`),
  profile_photo: text("profile_photo").$type<Privacy>().default(sql`'everyone'`),
  forwarded_messages: text("forwarded_messages").$type<Privacy>().default(sql`'everyone'`),
  calls: text("calls").$type<Privacy>().default(sql`'everyone'`),
  voice_message: text("voice_message").$type<Privacy>().default(sql`'everyone'`),
  messages: text("messages").$type<Privacy>().default(sql`'everyone'`),
  birthday: text("birthday").$type<Privacy>().default(sql`'everyone'`),
  bio: text("bio").$type<Privacy>().default(sql`'everyone'`),
  invites: text("invites").$type<Privacy>().default(sql`'everyone'`),
  account_ttl_delete: text("account_ttl_delete").default(sql`'6 months'`),
  sessions_ttl: text("sessions_ttl").default(sql`'6 months'`),
  auto_delete_msg: text("auto_delete_msg").default(sql`'off'`),
});

export const user_privacy_exceptions = pgTable("user_privacy_exceptions", {
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(),
  target_user_id: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const user_blacklist = pgTable("user_blacklist", {
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  target_id: uuid("target_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.user_id, table.target_id] })]);

// Sessions store only expires_at and used_at in plaintext (required for TTL/auto-delete logic).
// device_blob, ip_blob, location_blob are end-to-end encrypted by the client; the server
// stores raw ciphertext and cannot read the contents.
export const user_sessions = pgTable("user_sessions", {
  id: text("id").primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires_at: timestamp("expires_at").notNull(),
  used_at: timestamp("used_at").notNull().defaultNow(),
  device_blob: bytea("device_blob").notNull(),
  ip_blob: bytea("ip_blob").notNull(),
  location_blob: bytea("location_blob").notNull(),
});

// FCM / APNs device tokens for push notifications
export const user_device_tokens = pgTable("user_device_tokens", {
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  platform: text("platform").$type<"fcm" | "apps">().notNull(),
  device_id: text("device_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  // UNIQUE (user_id, device_id)
});
