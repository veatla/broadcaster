-- Создаётся после users, до stories.
-- После создания stories добавляется FK story_id → stories(id) (см. конец stories.sql).

CREATE TABLE IF NOT EXISTS attachments (
    id          TEXT        NOT NULL    PRIMARY KEY,
    message_id  UUID        NULL        REFERENCES messages (id)  ON DELETE SET NULL,
    chat_id     UUID        NULL        REFERENCES chats (id)     ON DELETE SET NULL,
    author_id   UUID        NOT NULL    REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_message   ON attachments (message_id, author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_chat_msg  ON attachments (chat_id, message_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_author    ON attachments (author_id, created_at);

-- Закрываем цикл: users.profile_photo → attachments(id)
ALTER TABLE users
    ADD CONSTRAINT fk_users_profile_photo
    FOREIGN KEY (profile_photo) REFERENCES attachments(id) ON DELETE SET NULL;
ALTER TABLE chats
    ADD CONSTRAINT fk_chats_avatar
    FOREIGN KEY (avatar) REFERENCES attachments(id) ON DELETE SET NULL;
