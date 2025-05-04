use askama::Template;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use sqlx::{types::time::OffsetDateTime, PgPool};
use uuid::Uuid;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    prompts: Vec<PromptSummary>,
}

#[derive(sqlx::Type, Clone)]
pub struct PromptSummary {
    id: Uuid,
    user_name: String,
    title: String,
    description: String,
    updated_at: OffsetDateTime,
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
