use askama::Template;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
    Form,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate {
    prompts: Vec<PromptRow>,
}

#[derive(Template, sqlx::FromRow, Clone)]
#[template(path = "prompt_row.html")]
pub struct PromptRow {
    id: Uuid,
    title: String,
    body: String,
}

pub async fn index(State(pool): State<PgPool>) -> impl IntoResponse {
    // let rows: Vec<PromptRow> = sqlx::query_as::<_, PromptRow>(
    //     "SELECT id, title, body FROM prompts ORDER BY created_at DESC",
    // )
    // .fetch_all(&pool)
    // .await
    // .unwrap_or_default();

    let rows = Vec::new();

    let template = IndexTemplate { prompts: rows };

    Html(template.render().expect("demo"))
}
