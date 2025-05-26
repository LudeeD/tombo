use serde::Deserialize;
use sqlx::types::Json;
use sqlx::{prelude::FromRow, Decode};
use time::OffsetDateTime;

pub mod handlers;

pub struct PromptTag {
    pub prompt_id: i64,
    pub id: i64,
    pub name: String,
    pub bg_color: String,
    pub text_color: String,
    pub kind: String,
}

#[derive(Debug, FromRow, Deserialize, Decode)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub bg_color: String,
    pub text_color: String,
    pub kind: String,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptList {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
    pub star_count: i64,
    pub tags: Option<Json<Option<Vec<Tag>>>>,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptListReady {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
    pub star_count: i64,
    pub tags: Vec<Tag>,
}

impl From<PromptList> for PromptListReady {
    fn from(item: PromptList) -> Self {
        let tags = match item.tags {
            Some(tags) => tags.0.unwrap_or_default(),
            None => Vec::new(),
        };

        PromptListReady {
            id: item.id,
            title: item.title,
            description: item.description,
            author: item.author,
            author_id: item.author_id,
            created_at: item.created_at,
            star_count: item.star_count,
            tags: tags,
        }
    }
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
    pub description: String,
    pub content: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
    pub star_count: i64,
    pub tags: Option<Json<Option<Vec<Tag>>>>,
}

#[derive(Debug, FromRow, Deserialize)]
pub struct PromptRowReady {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub content: String,
    pub author: String,
    pub author_id: i64,
    pub created_at: Option<OffsetDateTime>,
    pub star_count: i64,
    pub estimated_tokens: usize,
    pub tags: Vec<Tag>,
}

impl From<PromptRow> for PromptRowReady {
    fn from(item: PromptRow) -> Self {
        let tags = match item.tags {
            Some(tags) => tags.0.unwrap_or_default(),
            None => Vec::new(),
        };

        let estimated_tokens = estimate_token_count(&item.content);

        PromptRowReady {
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.content,
            author: item.author,
            author_id: item.author_id,
            created_at: item.created_at,
            star_count: item.star_count,
            estimated_tokens,
            tags: tags,
        }
    }
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

fn estimate_token_count(text: &str) -> usize {
    // Rough estimation: assume each word or 4 characters is a token
    let char_count = text.chars().count();
    let word_count = text.split_whitespace().count();

    // Average between word-based and character-based heuristic
    (char_count / 4 + word_count) / 2
}
