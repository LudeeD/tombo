-- Add migration script here
CREATE TABLE IF NOT EXISTS prompts (
    id          UUID PRIMARY KEY,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
