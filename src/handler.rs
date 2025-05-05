use askama::Template;
use axum::{
    extract::{Form, Path, State},
    response::{Html, IntoResponse},
};
use serde::Deserialize;
use sqlx::{types::time::OffsetDateTime, PgPool};
use uuid::Uuid;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    prompts: Vec<PromptSummary>,
}

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {}

#[derive(Template)]
#[template(path = "details_prompt.html")]
pub struct PromptRowTemplate {
    prompt: Prompt,
}

#[derive(sqlx::Type, Clone)]
pub struct PromptSummary {
    id: Uuid,
    user_name: String,
    title: String,
    description: String,
    updated_at: OffsetDateTime,
}

#[derive(sqlx::Type, Clone)]
pub struct Prompt {
    id: Uuid,
    user_name: String,
    title: String,
    description: String,
    content: String,
    updated_at: OffsetDateTime,
}

#[derive(Deserialize)]
pub struct CreatePromptForm {
    title: String,
    description: String,
    content: String,
}

pub async fn index(State(pool): State<PgPool>) -> impl IntoResponse {
    let rows: Vec<PromptSummary> = sqlx::query_as!(
        PromptSummary,
        "SELECT prompts.id, users.name AS user_name, title, description, prompts.updated_at
        FROM prompts
        INNER JOIN users ON prompts.user_id = users.id
        ORDER BY prompts.created_at DESC",
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let template = IndexTemplate { prompts: rows };

    Html(template.render().expect("demo"))
}

pub async fn add_prompt(State(pool): State<PgPool>) -> impl IntoResponse {
    let template = AddPromptTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}

pub async fn specific_prompt(
    State(pool): State<PgPool>,
    Path(prompt_id): Path<Uuid>,
) -> impl IntoResponse {
    let prompt = sqlx::query_as!(
        Prompt,
        "SELECT prompts.id, users.name AS user_name, title, description, content, prompts.updated_at
        FROM prompts
        INNER JOIN users ON prompts.user_id = users.id
        WHERE prompts.id = $1",
        prompt_id
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    let template = PromptRowTemplate { prompt };
    Html(template.render().expect("Failed to render prompt row"))
}
