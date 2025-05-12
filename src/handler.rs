use crate::types::NewUser;
use crate::types::PromptRow;
use crate::types::PromptSummary;
use crate::types::PromptVisibility;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use askama::Template;
use axum::extract::Path;
use axum::Form;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use serde::Deserialize;
use sqlx::types::time::OffsetDateTime;
use sqlx::PgPool;
use tracing::error;
use tracing::info;
use tracing::warn;
use uuid::Uuid;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {}

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {}

#[derive(Template)]
#[template(path = "details_prompt.html")]
pub struct PromptRowTemplate {}

pub async fn index() -> impl IntoResponse {
    let template = IndexTemplate {};

    Html(template.render().expect("demo"))
}

pub async fn specific_prompt(Path(prompt_id): Path<Uuid>) -> impl IntoResponse {
    let template = PromptRowTemplate {};
    Html(template.render().expect("Failed to render prompt row"))
}

pub async fn add_prompt() -> impl IntoResponse {
    let template = AddPromptTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}
