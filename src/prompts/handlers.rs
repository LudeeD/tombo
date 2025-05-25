use super::templates::ListTemplate;
use super::Tag;
use super::{templates::DetailTemplate, NewPrompt, PromptList, PromptRow};
use crate::{users::AuthSession, AppState};
use askama::Template;
use axum::{
    extract::{Path, State},
    response::{Html, IntoResponse, Redirect},
    Form,
};
use axum_messages::{Message, Messages};
use sqlx::types::Json;
use tracing::error;

pub async fn list(auth_session: AuthSession, State(state): State<AppState>) -> impl IntoResponse {
    let db = state.pool;

    let user = auth_session.user.map(|user| user.id);

    let tags: Vec<Tag> = sqlx::query_as!(Tag, "SELECT * FROM tags")
        .fetch_all(&db)
        .await
        .unwrap_or_else(|err| {
            error!("{err}");
            Vec::new()
        });

    let prompts: Vec<PromptList> = sqlx::query_as!(
        PromptList,
        "
        WITH feed AS (
            SELECT
                p.id,
                p.title,
                p.description,
                u.id                   AS author_id,
                u.username             AS author,
                p.created_at,
                COUNT(DISTINCT s.user_id)          AS star_count,
                NULLIF(
                    json_group_array(
                        CASE
                            WHEN t.id IS NOT NULL THEN
                                json_object(
                                    'id',       t.id,
                                    'name',     t.name,
                                    'bg_color', t.bg_color,
                                    'text_color', t.text_color,
                                    'kind',     t.kind
                                )
                            ELSE NULL
                        END
                    ),
                    '[null]'
                ) AS \"tags: Json<Option<Vec<Tag>>>\"
            FROM       prompts p
            JOIN       users          u  ON u.id = p.user_id
            LEFT JOIN  prompt_stars   s  ON s.prompt_id = p.id
            LEFT JOIN  prompt_tags    pt ON pt.prompt_id = p.id
            LEFT JOIN  tags           t  ON t.id = pt.tag_id
            WHERE      p.created_at >= datetime('now','-30 days')
            GROUP BY   p.id,
                       p.title,
                       p.description,
                       u.id,
                       u.username,
                       p.created_at
            ORDER BY   p.created_at DESC
            LIMIT      20 OFFSET $1
        )
        SELECT * FROM feed;",
        0
    )
    .fetch_all(&db)
    .await
    .unwrap_or_else(|err| {
        error!("{err}");
        Vec::new()
    });

    let template = ListTemplate {
        user,
        prompts: prompts.into_iter().map(|x| x.into()).collect(),
        tags,
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
