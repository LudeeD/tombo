use crate::types::{NewPromptForm, NewUser, PromptRow, PromptSummary, PromptVisibility};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use askama::Template;
use axum::extract::{Form, Path};
use axum::response::Redirect;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use chrono::Utc;
use entity::prompt;
use sea_orm::{prelude::ChronoDateTimeUtc, ActiveModelTrait};
use sea_orm::{ActiveValue::Set, DatabaseConnection};
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

pub async fn handle_add_prompt(
    State(db): State<DatabaseConnection>,
    Form(form): Form<NewPromptForm>,
) -> impl IntoResponse {
    // Extract form data, using empty string for optional fields if not provided
    let title = form.title;
    let content = form.content;
    let description = form.description.unwrap_or_else(|| String::new());

    let prompt = prompt::ActiveModel {
        title: Set(title),
        content: Set(content),
        description: Set(description),
        created_at: Set(Utc::now()),
        instructions: Set(String::new()),

        ..Default::default() // all other attributes are `NotSet`
    };

    let pear: prompt::Model = prompt.insert(&db).await.unwrap();

    "demo"
}
