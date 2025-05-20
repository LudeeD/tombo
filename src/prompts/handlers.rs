use askama::Template;
use axum::{
    extract::{Path, State},
    response::{Html, IntoResponse},
};
use tracing::error;

use super::{templates::DetailTemplate, PromptRow};
use super::{templates::ListTemplate, PromptData};
use crate::AppState;

pub async fn list(State(state): State<AppState>) -> impl IntoResponse {
    let db = state.pool;

    let prompts: Vec<PromptRow> = sqlx::query_as!(PromptRow, "SELECT * FROM prompts")
        .fetch_all(&db)
        .await
        .unwrap_or_else(|err| {
            error!("{err}");
            Vec::new()
        });

    let prompts: Vec<PromptData> = prompts.into_iter().map(PromptData::from).collect();

    let template = ListTemplate { prompts };

    Html(template.render().expect("demo"))
}

pub async fn detail(
    State(state): State<AppState>,
    Path(prompt_id): Path<i64>,
) -> impl IntoResponse {
    let db = state.pool;
    let prompt: Option<PromptRow> =
        sqlx::query_as!(PromptRow, "SELECT * FROM prompts WHERE id = ?", prompt_id)
            .fetch_optional(&db)
            .await
            .unwrap_or_else(|err| {
                error!("{err}");
                None
            });

    match prompt {
        Some(prompt) => {
            let prompt = prompt.into();
            let template = DetailTemplate {
                prompt,
                comments: Vec::new(),
                current_user_id: 0,
            };

            Html(template.render().expect("demo"))
        }
        None => Html(String::from("Not Found")),
    }
}
