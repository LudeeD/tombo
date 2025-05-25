ALTER TABLE prompts
ADD COLUMN user_id INTEGER REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_prompts_user_id ON prompts (user_id);

ALTER TABLE prompts
ADD COLUMN parent_prompt_id INTEGER REFERENCES prompts (id) ON DELETE SET NULL;

CREATE INDEX idx_prompts_parent ON prompts (parent_prompt_id);
