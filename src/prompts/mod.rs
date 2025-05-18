use chrono::NaiveDateTime;
use sqlx::prelude::FromRow;

pub mod handlers;
pub mod templates;

#[derive(Debug, FromRow)]
pub struct PromptRow {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub description: String,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug)]
pub struct PromptData {
    pub row: PromptRow,
    pub summary: String,
    pub tags: Vec<(i64, String)>,
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
            author_name: String::new(),
            comment_count: 0,
            star_count: 0,
        }
    }
}
