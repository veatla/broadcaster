import { sql } from "drizzle-orm";
import { pgTable, uuid, text, bigint, bigserial, boolean, timestamp, primaryKey, unique } from "drizzle-orm/pg-core";
import { bytea, citext } from "./drizzle.client";

export type Privacy = "everyone" | "contacts" | "nobody";

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    username: citext("username").notNull().unique(),
    password_hash: text("password_hash").notNull(),
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
export type UsersTable = typeof usersTable.$inferSelect;

export const userSettingsTable = pgTable("user_settings", {
    user_id: uuid("user_id").notNull().primaryKey(),
    preferred_language: text("preferred_language").notNull().default("en"),
});
export type UserSettingsTable = typeof userSettingsTable.$inferSelect;

export const userPrivacyTable = pgTable("user_privacy", {
    user_id: uuid("user_id").notNull().primaryKey(),
    last_seen: text("last_seen")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    online: text("online")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    profile_photo: text("profile_photo")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    forwarded_messages: text("forwarded_messages")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    calls: text("calls")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    voice_message: text("voice_message")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    messages: text("messages")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    birthday: text("birthday")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    bio: text("bio")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    invites: text("invites")
        .$type<Privacy>()
        .default(sql`'everyone'`),
    account_ttl_delete: text("account_ttl_delete").default(sql`'6 months'`),
    sessions_ttl: text("sessions_ttl").default(sql`'6 months'`),
    auto_delete_msg: text("auto_delete_msg").default(sql`'off'`),
});
export type UserPrivacyTable = typeof userPrivacyTable.$inferSelect;

export const userPrivacyExceptionsTable = pgTable(
    "user_privacy_exceptions",
    {
        user_id: uuid("user_id").notNull(),
        feature: text("feature").notNull(),
        target_user_id: uuid("target_user_id").notNull(),
    },
    (t) => [primaryKey({ columns: [t.user_id, t.feature, t.target_user_id] })],
);
export type UserPrivacyExceptionsTable = typeof userPrivacyExceptionsTable.$inferSelect;

export const userBlacklistTable = pgTable(
    "user_blacklist",
    {
        user_id: uuid("user_id").notNull(),
        target_id: uuid("target_id").notNull(),
    },
    (t) => [primaryKey({ columns: [t.user_id, t.target_id] })],
);
export type UserBlacklistTable = typeof userBlacklistTable.$inferSelect;

// Auth sessions + push notification tokens.
// device_blob, ip_blob, location_blob are E2E encrypted; the server stores raw ciphertext.
export const userSessionsTable = pgTable("user_sessions", {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    user_id: uuid("user_id").notNull(),
    expires_at: timestamp("expires_at").notNull(),
    used_at: timestamp("used_at").notNull().defaultNow(),
    device_blob: bytea("device_blob").notNull(),
    ip_blob: bytea("ip_blob").notNull(),
    device_id: text("device_id").notNull(),
    platform: text("platform").$type<"fcm" | "apns">().notNull(),
    location_blob: bytea("location_blob").notNull(),
});
export type UserSessionsTable = typeof userSessionsTable.$inferSelect;

// ─── Devices ─────────────────────────────────────────────────────────────────

// One row per app installation. The private key never leaves the device.
export const devicesTable = pgTable("devices", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    user_id: uuid("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    device_name: text("device_name").notNull(),
    status: text("status").$type<"active" | "revoked">().notNull().default("active"),
    identity_public_key: bytea("identity_public_key").notNull(),
    identity_key_fingerprint: bytea("identity_key_fingerprint").notNull().unique(),
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`NOW()`),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    last_seen_at: timestamp("last_seen_at", { withTimezone: true }),
});
export type DevicesTable = typeof devicesTable.$inferSelect;

// ─── Prekeys (X3DH) ──────────────────────────────────────────────────────────

export const deviceSignedPrekeysTable = pgTable(
    "device_signed_prekeys",
    {
        id: bigserial("id", { mode: "bigint" }).primaryKey(),
        device_id: uuid("device_id")
            .notNull()
            .references(() => devicesTable.id, { onDelete: "cascade" }),
        prekey_id: bigint("prekey_id", { mode: "bigint" }).notNull(),
        public_key: bytea("public_key").notNull(),
        signature: bytea("signature").notNull(),
        created_at: timestamp("created_at", { withTimezone: true })
            .notNull()
            .default(sql`NOW()`),
        expires_at: timestamp("expires_at", { withTimezone: true }),
        rotated_at: timestamp("rotated_at", { withTimezone: true }),
    },
    (t) => [unique().on(t.device_id, t.prekey_id)],
);
export type DeviceSignedPrekeysTable = typeof deviceSignedPrekeysTable.$inferSelect;

export const deviceOneTimePrekeysTable = pgTable(
    "device_one_time_prekeys",
    {
        id: bigserial("id", { mode: "bigint" }).primaryKey(),
        device_id: uuid("device_id")
            .notNull()
            .references(() => devicesTable.id, { onDelete: "cascade" }),
        prekey_id: bigint("prekey_id", { mode: "bigint" }).notNull(),
        public_key: bytea("public_key").notNull(),
        created_at: timestamp("created_at", { withTimezone: true })
            .notNull()
            .default(sql`NOW()`),
        consumed_at: timestamp("consumed_at", { withTimezone: true }),
    },
    (t) => [unique().on(t.device_id, t.prekey_id)],
);
export type DeviceOneTimePrekeysTable = typeof deviceOneTimePrekeysTable.$inferSelect;

// ─── Device pairing ──────────────────────────────────────────────────────────

// Temporary state for device-to-device key transfer. No permanent private keys stored here.
export const devicePairingSessionsTable = pgTable("device_pairing_sessions", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    from_device_id: uuid("from_device_id")
        .notNull()
        .references(() => devicesTable.id, { onDelete: "cascade" }),
    to_device_id: uuid("to_device_id").references(() => devicesTable.id, {
        onDelete: "cascade",
    }),
    pairing_code_hash: bytea("pairing_code_hash").notNull(),
    transfer_pubkey: bytea("transfer_pubkey").notNull(),
    state: text("state").$type<"pending" | "confirmed" | "expired" | "canceled">().notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`NOW()`),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export type DevicePairingSessionsTable = typeof devicePairingSessionsTable.$inferSelect;

// ─── Chats ────────────────────────────────────────────────────────────────────

export const chatsTable = pgTable("chats", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    chat_type: text("chat_type").$type<"direct" | "group">().notNull(),
    created_by_user_id: uuid("created_by_user_id")
        .notNull()
        .references(() => usersTable.id),
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`NOW()`),
});
export type ChatsTable = typeof chatsTable.$inferSelect;

export const chatMembersTable = pgTable(
    "chat_members",
    {
        chat_id: uuid("chat_id")
            .notNull()
            .references(() => chatsTable.id, { onDelete: "cascade" }),
        user_id: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        role: text("role").$type<"owner" | "admin" | "member">().notNull().default("member"),
        joined_at: timestamp("joined_at", { withTimezone: true })
            .notNull()
            .default(sql`NOW()`),
        left_at: timestamp("left_at", { withTimezone: true }),
        manually_unread: boolean("manually_unread").notNull().default(false),
    },
    (t) => [primaryKey({ columns: [t.chat_id, t.user_id] })],
);
export type ChatMembersTable = typeof chatMembersTable.$inferSelect;

// ─── Messages ─────────────────────────────────────────────────────────────────

// Server stores only ciphertext and routing data. x3dh_header present on session-initiating messages.
export const messagesTable = pgTable("messages", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    chat_id: uuid("chat_id")
        .notNull()
        .references(() => chatsTable.id, { onDelete: "cascade" }),
    sender_device_id: uuid("sender_device_id")
        .notNull()
        .references(() => devicesTable.id),
    ciphertext: bytea("ciphertext").notNull(),
    x3dh_header: bytea("x3dh_header"),
    msg_type: text("msg_type").$type<"message" | "control" | "sync">().notNull().default("message"),
    created_at: timestamp("created_at", { withTimezone: true })
        .notNull()
        .default(sql`NOW()`),
});
export type MessagesTable = typeof messagesTable.$inferSelect;

export const messageReadsTable = pgTable(
    "message_reads",
    {
        message_id: uuid("message_id").notNull(),
        user_id: uuid("user_id").notNull(),
        read_at: timestamp("read_at")
            .notNull()
            .default(sql`NOW()`),
    },
    (t) => [primaryKey({ columns: [t.message_id, t.user_id] })],
);
export type MessageReadsTable = typeof messageReadsTable.$inferSelect;

export const messageReactionsTable = pgTable(
    "message_reactions",
    {
        message_id: uuid("message_id").notNull(),
        user_id: uuid("user_id").notNull(),
        emoji: text("emoji").notNull(),
        created_at: timestamp("created_at")
            .notNull()
            .default(sql`NOW()`),
    },
    (t) => [primaryKey({ columns: [t.message_id, t.user_id, t.emoji] })],
);
export type MessageReactionsTable = typeof messageReactionsTable.$inferSelect;

// ─── Attachments ──────────────────────────────────────────────────────────────

export const attachmentsTable = pgTable("attachments", {
    id: text("id").primaryKey(),
    message_id: uuid("message_id"),
    chat_id: uuid("chat_id"),
    author_id: uuid("author_id").notNull(),
    created_at: timestamp("created_at")
        .notNull()
        .default(sql`NOW()`),
    updated_at: timestamp("updated_at"),
});
export type AttachmentsTable = typeof attachmentsTable.$inferSelect;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const storiesTable = pgTable("stories", {
    id: uuid("id")
        .primaryKey()
        .default(sql`uuid_generate_v4()`),
    author_id: uuid("author_id").notNull(),
    attachment: text("attachment").notNull(),
    caption: text("caption"),
    created_at: timestamp("created_at")
        .notNull()
        .default(sql`NOW()`),
    updated_at: timestamp("updated_at"),
});
export type StoriesTable = typeof storiesTable.$inferSelect;

export const storyViewsTable = pgTable(
    "story_views",
    {
        story_id: uuid("story_id").notNull(),
        user_id: uuid("user_id").notNull(),
        view_at: timestamp("view_at")
            .notNull()
            .default(sql`NOW()`),
        reaction_at: timestamp("reaction_at"),
        reaction: text("reaction"),
    },
    (t) => [primaryKey({ columns: [t.story_id, t.user_id] })],
);
export type StoryViewsTable = typeof storyViewsTable.$inferSelect;

export const tables = {
    users: usersTable,
    userSettings: userSettingsTable,
    userPrivacy: userPrivacyTable,
    userPrivacyExceptions: userPrivacyExceptionsTable,
    userBlacklist: userBlacklistTable,
    userSessions: userSessionsTable,
    devices: devicesTable,
    deviceSignedPrekeys: deviceSignedPrekeysTable,
    deviceOneTimePrekeys: deviceOneTimePrekeysTable,
    devicePairingSessions: devicePairingSessionsTable,
    chats: chatsTable,
    chatMembers: chatMembersTable,
    messages: messagesTable,
    messageReads: messageReadsTable,
    messageReactions: messageReactionsTable,
    attachments: attachmentsTable,
    stories: storiesTable,
    storyViews: storyViewsTable,
};
