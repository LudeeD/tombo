use super::{NewPrompt, PromptData, PromptList, PromptRow, PromptRowReady};
use super::{PromptListReady, Tag};
use crate::{users::AuthSession, AppState};
use askama::Template;
use axum::http::StatusCode;
use axum::{
    extract::{Path, State},
    response::{Html, IntoResponse, Redirect},
    Form,
};
use axum_messages::{Message, Messages};
use sqlx::types::Json;
use tracing::span::Record;
use tracing::{error, info};

#[derive(Template)]
#[template(path = "list_prompt.html")]
pub struct ListTemplate {
    pub user: Option<i64>,
    pub tags: Vec<Tag>,
    pub prompts: Vec<PromptListReady>,
}

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

#[derive(Template)]
#[template(path = "details_prompt.html")]
pub struct DetailTemplate {
    pub user: Option<i64>,
    pub prompt: PromptRowReady,
}
pub async fn detail(
    auth_session: AuthSession,
    State(state): State<AppState>,
    Path(prompt_id): Path<i64>,
) -> impl IntoResponse {
    let db = state.pool;

    let user = auth_session.user.map(|user| user.id);

    let prompt: Option<PromptRow> = sqlx::query_as!(
        PromptRow,
        "
            SELECT
                p.id,
                p.title,
                p.description,
                u.id                   AS author_id,
                u.username             AS author,
                p.created_at,
                p.content,
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
            WHERE      p.id = $1
            GROUP BY   p.id,
                       p.title,
                       p.description,
                       u.id,
                       u.username,
                       p.created_at
            ORDER BY   p.created_at DESC
        ",
        prompt_id
    )
    .fetch_optional(&db)
    .await
    .unwrap_or_else(|err| {
        error!("{err}");
        None
    });

    match prompt {
        Some(prompt) => {
            let prompt = prompt.into();
            let template = DetailTemplate { user, prompt };

            Html(template.render().expect("demo"))
        }
        None => Html(String::from("Not Found")),
    }
}

pub async fn raw(State(state): State<AppState>, Path(prompt_id): Path<i64>) -> impl IntoResponse {
    let db = state.pool;
    let prompt = sqlx::query!("SELECT content  FROM prompts WHERE id = ?", prompt_id)
        .fetch_optional(&db)
        .await
        .unwrap_or_else(|err| {
            error!("{err}");
            None
        });

    match prompt {
        Some(prompt) => (StatusCode::OK, prompt.content),
        None => (StatusCode::NOT_FOUND, format!("Not Found")),
    }
}

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {
    user: Option<i64>,
    messages: Vec<Message>,
}

pub async fn create(
    auth_session: AuthSession,
    messages: Messages,
    State(state): State<AppState>,
    Form(form): Form<NewPrompt>,
) -> impl IntoResponse {
    let db = state.pool;

    let user = auth_session.user.map(|user| user.id);

    let result = sqlx::query!(
        "INSERT INTO prompts (title, content, description, user_id) VALUES (?, ?, ?, ?)",
        form.title,
        form.content,
        form.description,
        user
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

pub async fn add_prompt(auth_session: AuthSession, messages: Messages) -> impl IntoResponse {
    let user = auth_session.user.map(|user| user.id);

    let template = AddPromptTemplate {
        user,
        messages: messages.into_iter().collect(),
    };
    Html(template.render().expect("Failed to render add prompt form"))
}

#[derive(Template)]
#[template(path = "./htmx/tags.html")]
pub struct AvailableTags {
    prompt_id: i64,
    tags: Vec<Tag>,
}
pub async fn tag_edit(
    auth_session: AuthSession,
    Path(prompt_id): Path<i64>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let db = state.pool;
    let tags: Vec<Tag> = sqlx::query_as!(Tag, "SELECT * FROM tags")
        .fetch_all(&db)
        .await
        .unwrap_or_else(|err| {
            error!("{err}");
            Vec::new()
        });
    let template = AvailableTags { prompt_id, tags };

    Html(template.render().expect("Failed to render add prompt form"))
}

pub async fn add_tags(
    auth_session: AuthSession,
    Path(prompt_id): Path<i64>,
    State(state): State<AppState>,
    Form(form): Form<Vec<(String, String)>>, // Add form extraction
) -> impl IntoResponse {
    let db = state.pool;

    let user = auth_session.user.map(|user| user.id);

    // Ensure the user is the creator of this prompt
    let Ok(Some(_check_auth)) = sqlx::query!(
        // Add 'as "one"' (or any valid identifier)
        r#"SELECT 1 as "one" FROM prompts WHERE id = ? AND user_id = ?"#,
        prompt_id,
        user
    )
    .fetch_optional(&db)
    .await
    else {
        return (StatusCode::UNAUTHORIZED, "Unauthorized").into_response();
    };

    // Delete existing tags for this prompt to avoid duplicates
    sqlx::query!("DELETE FROM prompt_tags WHERE prompt_id = ?", prompt_id)
        .execute(&db)
        .await;

    // Insert new tag associations
    for (name, tag_id) in form.iter() {
        if name == "tags[]" {
            if let Ok(tag_id) = tag_id.parse::<i64>() {
                sqlx::query!(
                    "INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)",
                    prompt_id,
                    tag_id
                )
                .execute(&db)
                .await;
            }
        }
    }

    return Redirect::to(&format!("/prompt/{prompt_id}")).into_response();
}
