use askama::Template;
use axum::{
    extract::{Path, State},
    response::{Html, IntoResponse, Redirect},
    Form,
};
use axum_messages::{Message, Messages};
use tracing::error;

use super::{templates::DetailTemplate, NewPrompt, PromptRow};
use super::{templates::ListTemplate, PromptData};
use crate::{users::AuthSession, AppState};

pub async fn list(auth_session: AuthSession, State(state): State<AppState>) -> impl IntoResponse {
    let db = state.pool;

    let prompts: Vec<PromptRow> = sqlx::query_as!(PromptRow, "SELECT * FROM prompts")
        .fetch_all(&db)
        .await
        .unwrap_or_else(|err| {
            error!("{err}");
            Vec::new()
        });

    let prompts: Vec<PromptData> = prompts.into_iter().map(PromptData::from).collect();

    let template = ListTemplate {
        user_logged_in: auth_session.user.is_some(),
        prompts,
    };

    Html(template.render().expect("demo"))
}

pub async fn detail(
    auth_session: AuthSession,
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
                user_logged_in: auth_session.user.is_some(),
                prompt,
                comments: Vec::new(),
            };

            Html(template.render().expect("demo"))
        }
        None => Html(String::from("Not Found")),
    }
}

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {
    messages: Vec<Message>,
}

pub async fn create(
    messages: Messages,
    State(state): State<AppState>,
    Form(form): Form<NewPrompt>,
) -> impl IntoResponse {
    let db = state.pool;

    let result = sqlx::query!(
        "INSERT INTO prompts (title, content, description) VALUES (?, ?, ?)",
        form.title,
        form.content,
        form.description
    )
    .execute(&db)
    .await;

    match result {
        Ok(_) => {
            messages.info(format!("Successfully created a new prompt"));
        }
        Err(err) => {
            error!("Failed to create prompt: {}", err);
            messages.warning(format!("Failed to create prompt."));
        }
    };
    return Redirect::to("/prompt/new").into_response();
}

pub async fn add_prompt(messages: Messages) -> impl IntoResponse {
    let template = AddPromptTemplate {
        messages: messages.into_iter().collect(),
    };
    Html(template.render().expect("Failed to render add prompt form"))
}
