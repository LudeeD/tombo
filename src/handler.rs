use crate::types::PromptRow;
use crate::types::PromptSummary;
use crate::types::PromptVisibility;
use askama::Template;
use axum::extract::Path;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use sqlx::PgPool;
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
    prompt: PromptRow,
}

pub async fn index(State(pool): State<PgPool>) -> impl IntoResponse {
    let rows: Vec<PromptSummary> = sqlx::query_as!(
        PromptSummary,
        r#"
        SELECT
            prompts.id,
            prompts.created_by,
            users.name as created_by_name,
            prompts.title,
            prompts.description,
            COALESCE(SUM(prompt_votes.vote_type), 0) as upvotes
        FROM prompts
        JOIN users ON users.id = prompts.created_by
        LEFT JOIN prompt_votes ON prompt_votes.prompt_id = prompts.id
        WHERE prompts.visibility = 'public'
        GROUP BY prompts.id, prompts.created_by, users.name, prompts.title, prompts.description
        ORDER BY prompts.created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let template = IndexTemplate { prompts: rows };

    Html(template.render().expect("demo"))
}

pub async fn specific_prompt(
    State(pool): State<PgPool>,
    Path(prompt_id): Path<Uuid>,
) -> impl IntoResponse {
    let prompt: PromptRow = sqlx::query_as!(
        PromptRow,
        "SELECT
                id,
                created_by,
                parent_id,
                title,
                description,
                content,
                visibility AS \"visibility: PromptVisibility\",
                created_at,
                updated_at
            FROM prompts
            WHERE prompts.id = $1",
        prompt_id
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    let template = PromptRowTemplate { prompt };
    Html(template.render().expect("Failed to render prompt row"))
}

// pub async fn add_prompt(State(pool): State<PgPool>) -> impl IntoResponse {
//     let template = AddPromptTemplate {};
//     Html(template.render().expect("Failed to render add prompt form"))
// }
