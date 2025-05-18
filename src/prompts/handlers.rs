use askama::Template;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use tracing::{error, info};

use super::PromptRow;
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
