CREATE TABLE IF NOT EXISTS users (
    id                  UUID            NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname            TEXT            NOT NULL    UNIQUE,
    password_hash       TEXT            NOT NULL,
    public_key          TEXT            NOT NULL,
    profile_photo       TEXT            NULL,       -- FK added after attachments table is created
    first_name          TEXT            NOT NULL,
    last_name           TEXT            NOT NULL,
    bio                 TEXT            NULL,
    privacy_flags       BIGINT          NOT NULL    DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NULL,
    deactivated_at      TIMESTAMPTZ     NULL,
    last_seen           TIMESTAMPTZ     NULL,
    online              BOOLEAN         NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id             UUID            NOT NULL    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_language  TEXT            NOT NULL    DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS user_privacy (
    user_id             UUID            NOT NULL    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen           TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (last_seen IN ('everyone', 'contacts', 'nobody')),
    online              TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (online IN ('everyone', 'contacts', 'nobody')),
    profile_photo       TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (profile_photo IN ('everyone', 'contacts', 'nobody')),
    forwarded_messages  TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (forwarded_messages IN ('everyone', 'contacts', 'nobody')),
    calls               TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (calls IN ('everyone', 'contacts', 'nobody')),
    voice_message       TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (voice_message IN ('everyone', 'contacts', 'nobody')),
    messages            TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (messages IN ('everyone', 'contacts', 'nobody')),
    birthday            TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (birthday IN ('everyone', 'contacts', 'nobody')),
    bio                 TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (bio IN ('everyone', 'contacts', 'nobody')),
    invites             TEXT            NOT NULL    DEFAULT 'everyone'   CHECK (invites IN ('everyone', 'contacts', 'nobody')),

    account_ttl_delete  TEXT            NOT NULL    DEFAULT '6 months',
    sessions_ttl        TEXT            NOT NULL    DEFAULT '6 months',
    auto_delete_msg     TEXT            NOT NULL    DEFAULT 'off'
);

CREATE TABLE IF NOT EXISTS user_privacy_exceptions (
    user_id             UUID            NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    feature             TEXT            NOT NULL,
    target_user_id      UUID            NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, feature, target_user_id)
);

CREATE TABLE IF NOT EXISTS user_blacklist (
    user_id             UUID            NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    target_id           UUID            NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_user_id   ON user_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_target_id ON user_blacklist(target_id);

-- Sessions store only expires_at and used_at in plaintext (required for TTL/auto-delete logic).
-- device_blob, ip_blob, location_blob are end-to-end encrypted by the client; the server
-- stores raw ciphertext and cannot read the contents.
CREATE TABLE IF NOT EXISTS user_sessions (
    id              TEXT        NOT NULL    PRIMARY KEY,
    user_id         UUID        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    device_blob     BYTEA       NOT NULL,
    ip_blob         BYTEA       NOT NULL,
    location_blob   BYTEA       NOT NULL
);

-- FCM / APNs device tokens for push notifications
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id          UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL    UNIQUE,
    platform    TEXT        NOT NULL    CHECK (platform IN ('fcm', 'apns')),
    device_id   TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON user_device_tokens (user_id);
