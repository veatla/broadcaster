CREATE TABLE IF NOT EXISTS chats (
    id          UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    avatar      TEXT        NULL,
    title       TEXT        NOT NULL,
    type        TEXT        NOT NULL    CHECK (type IN ('private', 'group', 'channel')),
    -- Только для type = 'private': денормализованная пара участников для уникального индекса
    user1_id    UUID        NULL        REFERENCES users(id),
    user2_id    UUID        NULL        REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),

    CONSTRAINT chk_private_users CHECK (
        (type = 'private' AND user1_id IS NOT NULL AND user2_id IS NOT NULL AND user1_id <> user2_id)
        OR
        (type <> 'private' AND user1_id IS NULL AND user2_id IS NULL)
    )
);

-- Гарантирует единственный приватный чат между двумя пользователями
CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_private_pair
    ON chats (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
    WHERE type = 'private';

CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats (created_at);
CREATE INDEX IF NOT EXISTS idx_chats_title      ON chats (title, created_at);

CREATE TABLE IF NOT EXISTS chat_members (
    chat_id          UUID        NOT NULL    REFERENCES chats(id)  ON DELETE CASCADE,
    user_id          UUID        NOT NULL    REFERENCES users(id)  ON DELETE CASCADE,
    role             TEXT        NOT NULL    DEFAULT 'member'      CHECK (role IN ('owner', 'admin', 'member')),
    joined_at        TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    manually_unread  BOOLEAN     NOT NULL    DEFAULT FALSE,
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members (user_id);
