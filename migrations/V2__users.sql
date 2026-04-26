CREATE TABLE IF NOT EXISTS users (
    id                  UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    username            CITEXT      NOT NULL    UNIQUE,
    password_hash       TEXT        NOT NULL,
    profile_photo       TEXT        NULL,
    first_name          TEXT        NOT NULL,
    last_name           TEXT        NOT NULL,
    bio                 TEXT        NULL,
    privacy_flags       BIGINT      NOT NULL    DEFAULT 0,
    created_at          TIMESTAMP   NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMP   NULL,
    deactivated_at      TIMESTAMP   NULL,
    last_seen           TIMESTAMP   NULL,
    online              BOOLEAN     NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id             UUID    NOT NULL    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_language  TEXT    NOT NULL    DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS user_privacy (
    user_id             UUID    NOT NULL    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen           TEXT    NULL        DEFAULT 'everyone',
    online              TEXT    NULL        DEFAULT 'everyone',
    profile_photo       TEXT    NULL        DEFAULT 'everyone',
    forwarded_messages  TEXT    NULL        DEFAULT 'everyone',
    calls               TEXT    NULL        DEFAULT 'everyone',
    voice_message       TEXT    NULL        DEFAULT 'everyone',
    messages            TEXT    NULL        DEFAULT 'everyone',
    birthday            TEXT    NULL        DEFAULT 'everyone',
    bio                 TEXT    NULL        DEFAULT 'everyone',
    invites             TEXT    NULL        DEFAULT 'everyone',
    account_ttl_delete  TEXT    NULL        DEFAULT '6 months',
    sessions_ttl        TEXT    NULL        DEFAULT '6 months',
    auto_delete_msg     TEXT    NULL        DEFAULT 'off'
);

CREATE TABLE IF NOT EXISTS user_privacy_exceptions (
    user_id             UUID    NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    feature             TEXT    NOT NULL,
    target_user_id      UUID    NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, feature, target_user_id)
);

CREATE TABLE IF NOT EXISTS user_blacklist (
    user_id     UUID    NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    target_id   UUID    NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_user_id   ON user_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blacklist_target_id ON user_blacklist(target_id);

CREATE TABLE IF NOT EXISTS user_sessions (
    id              TEXT        NOT NULL    PRIMARY KEY,
    user_id         UUID        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMP   NOT NULL,
    used_at         TIMESTAMP   NOT NULL    DEFAULT NOW(),
    device_blob     BYTEA       NOT NULL,
    ip_blob         BYTEA       NOT NULL,
    location_blob   BYTEA       NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
    id                          UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    device_name                 TEXT        NOT NULL,
    status                      TEXT        NOT NULL    DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    identity_public_key         BYTEA       NOT NULL,
    identity_key_fingerprint    BYTEA       NOT NULL    UNIQUE,
    created_at                  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    revoked_at                  TIMESTAMPTZ NULL,
    last_seen_at                TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS device_signed_prekeys (
    id          BIGSERIAL   NOT NULL    PRIMARY KEY,
    device_id   UUID        NOT NULL    REFERENCES devices(id) ON DELETE CASCADE,
    prekey_id   BIGINT      NOT NULL,
    public_key  BYTEA       NOT NULL,
    signature   BYTEA       NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NULL,
    rotated_at  TIMESTAMPTZ NULL,
    UNIQUE (device_id, prekey_id)
);

CREATE TABLE IF NOT EXISTS device_one_time_prekeys (
    id          BIGSERIAL   NOT NULL    PRIMARY KEY,
    device_id   UUID        NOT NULL    REFERENCES devices(id) ON DELETE CASCADE,
    prekey_id   BIGINT      NOT NULL,
    public_key  BYTEA       NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    consumed_at TIMESTAMPTZ NULL,
    UNIQUE (device_id, prekey_id)
);

CREATE TABLE IF NOT EXISTS device_pairing_sessions (
    id                  UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_device_id      UUID        NOT NULL    REFERENCES devices(id) ON DELETE CASCADE,
    to_device_id        UUID        NULL        REFERENCES devices(id) ON DELETE CASCADE,
    pairing_code_hash   BYTEA       NOT NULL,
    transfer_pubkey     BYTEA       NOT NULL,
    state               TEXT        NOT NULL    CHECK (state IN ('pending', 'confirmed', 'expired', 'canceled')),
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL
);
