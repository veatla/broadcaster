CREATE TABLE IF NOT EXISTS stories (
    id          UUID        NOT NULL    PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id   UUID        NOT NULL    REFERENCES users(id)       ON DELETE CASCADE,
    attachment  TEXT        NOT NULL    REFERENCES attachments(id) ON DELETE RESTRICT,
    caption     TEXT        NULL,
    created_at  TIMESTAMP   NOT NULL    DEFAULT NOW(),
    updated_at  TIMESTAMP   NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories (author_id, created_at);

CREATE TABLE IF NOT EXISTS story_views (
    story_id    UUID        NOT NULL    REFERENCES stories(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL    REFERENCES users(id)   ON DELETE CASCADE,
    view_at     TIMESTAMP   NOT NULL    DEFAULT NOW(),
    reaction_at TIMESTAMP   NULL,
    reaction    TEXT        NULL,
    PRIMARY KEY (story_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_story_views_user ON story_views (user_id, view_at);
