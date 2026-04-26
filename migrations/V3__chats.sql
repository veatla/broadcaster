CREATE TABLE IF NOT EXISTS chats (
    id                  UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    type                TEXT        NOT NULL    CHECK (type IN ('private', 'group')),
    title               TEXT        NOT NULL    DEFAULT '',
    avatar              TEXT        NULL,
    created_by_user_id  UUID        NOT NULL    REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_members (
    chat_id         UUID        NOT NULL    REFERENCES chats(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL    REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT        NOT NULL    DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    left_at         TIMESTAMPTZ NULL,
    manually_unread BOOLEAN     NOT NULL    DEFAULT FALSE,
    cleared_at      TIMESTAMPTZ NULL,
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members (user_id);
