use axum::Form;
use serde::{Deserialize, Serialize};
use sqlx::types::time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "prompt_visibility", rename_all = "lowercase")]
pub enum PromptVisibility {
    Private,
    Public,
    Shareable,
}

#[derive(Debug, sqlx::Type)]
pub struct PromptRow {
    pub id: Uuid,
    pub created_by: Uuid,
    pub parent_id: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub content: String,
    pub visibility: PromptVisibility,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, sqlx::Type)]
pub struct PromptSummary {
    pub id: Uuid,
    pub created_by: Uuid,
    pub created_by_name: String,
    pub title: String,
    pub description: String,
    pub upvotes: Option<i64>,
}

#[derive(Debug, sqlx::Type)]
pub struct NewUser {
    pub email: String,
    pub name: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct NewPromptForm {
    #[serde(rename = "prompt-title")]
    pub title: String,
    #[serde(rename = "prompt-text")]
    pub content: String,
    #[serde(rename = "prompt-tags")]
    pub tags: Option<String>,
    #[serde(rename = "prompt-description")]
    pub description: Option<String>,
}
