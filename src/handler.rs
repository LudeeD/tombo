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
#[template(path = "prompt_row.html")]
pub struct PromptRowTemplate {
    prompt: PromptSummary,
}

#[derive(sqlx::Type, Clone)]
pub struct PromptSummary {
    id: Uuid,
    user_name: String,
    title: String,
    description: String,
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

pub async fn create_prompt(
    State(pool): State<PgPool>,
    Form(form): Form<CreatePromptForm>,
) -> impl IntoResponse {
    // For demo purposes, we'll use a fixed user ID
    // In a real app, you would get this from authentication
    let user_id = Uuid::parse_str("07dacf78-07f4-4302-9f45-c32e58b03c5b").unwrap();

    let prompt_id = sqlx::query!(
        "INSERT INTO prompts (user_id, title, description, content, visibility)
         VALUES ($1, $2, $3, $4, 'public')
         RETURNING id",
        user_id,
        form.title,
        form.description,
        form.content,
    )
    .fetch_one(&pool)
    .await
    .map(|row| row.id)
    .unwrap_or_else(|_| Uuid::nil());

    // Query the newly created prompt to get user information
    let prompt = sqlx::query_as!(
        PromptSummary,
        "SELECT prompts.id, users.name AS user_name, title, description, prompts.updated_at
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

pub async fn specific_prompt(
    State(pool): State<PgPool>,
    Path(prompt_id): Path<Uuid>,
) -> impl IntoResponse {
    let prompt = sqlx::query_as!(
        PromptSummary,
        "SELECT prompts.id, users.name AS user_name, title, description, prompts.updated_at
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
