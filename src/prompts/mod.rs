use serde::Deserialize;
use sqlx::prelude::FromRow;
use time::OffsetDateTime;

pub mod handlers;
pub mod templates;

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptList {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
    pub star_count: i64,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptListData {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct NewPrompt {
    pub title: String,
    pub content: String,
    pub tags: String,
    pub description: String,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptRow {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub description: String,
    pub user_id: Option<i64>,
    pub parent_prompt_id: Option<i64>,
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug)]
pub struct PromptData {
    pub row: PromptRow,
    pub summary: String,
    pub tags: Vec<(i64, String)>,
    pub author_id: i64,
    pub author_name: String,
    pub comment_count: i64,
    pub star_count: i64,
}

impl From<PromptRow> for PromptData {
    fn from(item: PromptRow) -> Self {
        PromptData {
            row: item,
            summary: String::new(),
            tags: Vec::new(),
            author_id: 0,
            author_name: String::new(),
            comment_count: 0,
            star_count: 0,
        }
    }
}
