CREATE TABLE IF NOT EXISTS messages (
    id          UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id     UUID        NOT NULL    REFERENCES chats (id)    ON DELETE CASCADE,
    sender_id   UUID        NULL        REFERENCES users (id)    ON DELETE SET NULL,
    replied_to  UUID        NULL        REFERENCES messages (id) ON DELETE SET NULL,
    content     TEXT,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages (chat_id, created_at);

CREATE TABLE IF NOT EXISTS message_reads (
    message_id  UUID        NOT NULL    REFERENCES messages (id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL    REFERENCES users (id)    ON DELETE CASCADE,
    read_at     TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads (user_id, read_at);

CREATE TABLE IF NOT EXISTS message_reactions (
    message_id  UUID        NOT NULL    REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL    REFERENCES users(id)    ON DELETE CASCADE,
    emoji       TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)  -- несколько реакций от одного пользователя
    -- PRIMARY KEY (message_id, user_id)       -- только одна реакция
);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions (message_id, emoji);

CREATE TABLE IF NOT EXISTS message_user_state (
    message_id  UUID        NOT NULL    REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL    REFERENCES users(id)    ON DELETE CASCADE,
    deleted_at  TIMESTAMPTZ,
    read_at     TIMESTAMPTZ,
    PRIMARY KEY (message_id, user_id)
)