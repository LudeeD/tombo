CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    bg_color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id INTEGER NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (prompt_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt ON prompt_tags (prompt_id);

CREATE TABLE IF NOT EXISTS prompt_stars (
    prompt_id INTEGER NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    starred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (prompt_id, user_id) -- 1 star per user
);

CREATE INDEX IF NOT EXISTS idx_prompt_stars_user ON prompt_stars (user_id);
