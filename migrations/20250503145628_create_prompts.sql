-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === USERS ===
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW ()
);

-- === ENUM TYPE FOR VISIBILITY ===
CREATE TYPE prompt_visibility AS ENUM ('private', 'public', 'shareable');

-- === PROMPTS ===
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES prompts (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility prompt_visibility NOT NULL DEFAULT 'private',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- === PROMPT VOTES ===
CREATE TABLE prompt_votes (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
    created_at TIMESTAMPTZ DEFAULT NOW (),
    PRIMARY KEY (user_id, prompt_id)
);

-- === PROMPT LIBRARY (CURATED PROMPTS) ===
CREATE TABLE prompt_library (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW (),
    PRIMARY KEY (user_id, prompt_id)
);

-- === SHARED PROMPTS ===
CREATE TABLE shared_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW (),
    expires_at TIMESTAMPTZ -- NULL means no expiration
);

-- === INDEXES ===
CREATE INDEX idx_prompts_created_by ON prompts (created_by);

CREATE INDEX idx_prompts_visibility ON prompts (visibility);

CREATE INDEX idx_shared_prompts_prompt_id ON shared_prompts (prompt_id);

CREATE INDEX idx_prompt_votes_prompt_id ON prompt_votes (prompt_id);

CREATE INDEX idx_prompt_library_user_id ON prompt_library (user_id);
