use crate::types::NewUser;
use crate::types::PromptRow;
use crate::types::PromptSummary;
use crate::types::PromptVisibility;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use askama::Template;
use axum::extract::Path;
use axum::Form;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use serde::Deserialize;
use sqlx::types::time::OffsetDateTime;
use sqlx::PgPool;
use tracing::error;
use tracing::info;
use tracing::warn;
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
pub struct PromptRowTemplate {}

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
    let template = PromptRowTemplate {};
    Html(template.render().expect("Failed to render prompt row"))
}

pub async fn add_prompt(State(pool): State<PgPool>) -> impl IntoResponse {
    let template = AddPromptTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}

#[derive(Template)]
#[template(path = "login.html")]
pub struct LoginTemplate {}

pub async fn login_page(State(pool): State<PgPool>) -> impl IntoResponse {
    let template = LoginTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}

#[derive(Template)]
#[template(path = "signup.html")]
pub struct SignUpTemplate {
    error: Option<String>,
    success: bool,
}

pub async fn signup_page(State(pool): State<PgPool>) -> impl IntoResponse {
    let template = SignUpTemplate {
        error: None,
        success: false,
    };
    Html(template.render().expect("Failed to render add prompt form"))
}

#[derive(Deserialize, Debug)]
pub struct SignupForm {
    email: String,
    username: String,
    password: String,
    confirm_password: String,
}

pub async fn handle_signup(
    State(pool): State<PgPool>,
    Form(form_data): Form<SignupForm>,
) -> impl IntoResponse {
    info!("Attempting to sign up user: {}", form_data.username);

    if form_data.password != form_data.confirm_password {
        let template = SignUpTemplate {
            error: Some(String::from("Passowrds do not match")),
            success: false,
        };
        return Html(template.render().expect("Failed to render add prompt form"));
    }
    let salt = SaltString::generate(&mut OsRng);

    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(form_data.password.as_bytes(), &salt)
        .expect("Failed to generate hash")
        .to_string();

    info!("hash: {password_hash}");

    let parsed_hash = PasswordHash::new(&password_hash).expect("Failed to parse password hash");
    assert!(Argon2::default()
        .verify_password(form_data.password.as_bytes(), &parsed_hash)
        .is_ok());

    let user = NewUser {
        email: form_data.email,
        name: form_data.username,
        password: password_hash,
    };

    let insert_user_query = sqlx::query!(
        r#"
        INSERT INTO users (email, name, password)
        VALUES ($1, $2, $3)
        "#,
        user.email,
        user.name,
        user.password
    );

    insert_user_query
        .execute(&pool)
        .await
        .expect("Failed to insert user");

    let template = SignUpTemplate {
        error: None,
        success: true,
    };

    return Html(template.render().expect("Failed to render add prompt form"));
}
