use crate::users::{AuthSession, Credentials};
use askama::Template;
use axum::http::StatusCode;
use axum::{response::Json as ResponseJson, Json};
use axum::{
    response::{Html, IntoResponse, Redirect},
    Form,
};
use axum_messages::{Message, Messages};

#[derive(Template)]
#[template(path = "signup.html")]
pub struct SignUpTemplate {
    messages: Vec<Message>,
}

#[derive(Template)]
#[template(path = "login.html")]
pub struct LoginTemplate {
    messages: Vec<Message>,
}

pub mod get {
    use serde_json::{json, Value};

    use super::*;

    pub async fn login(messages: Messages) -> impl IntoResponse {
        let template = LoginTemplate {
            messages: messages.into_iter().collect(),
        };

        Html(template.render().expect("demo"))
    }

    pub async fn signup(messages: Messages) -> impl IntoResponse {
        let template = SignUpTemplate {
            messages: messages.into_iter().collect(),
        };

        Html(template.render().expect("demo"))
    }

    pub async fn profile(auth_session: AuthSession) -> (StatusCode, ResponseJson<Value>) {
        if let Some(user) = auth_session.user {
            (
                StatusCode::OK,
                ResponseJson(json!({
                    "id": user.id,
                    "email": user.email,
                })),
            )
        } else {
            (StatusCode::NOT_FOUND, ResponseJson(json!({})))
        }
    }

    pub async fn logout(mut auth_session: AuthSession) -> impl IntoResponse {
        match auth_session.logout().await {
            Ok(_) => Redirect::to("/").into_response(),
            Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        }
    }
}

pub mod post {

    use axum::extract::State;
    use password_auth::generate_hash;
    use tracing::{error, info, warn};

    use crate::{users::User, AppState};

    use super::*;

    pub async fn login(
        mut auth_session: AuthSession,
        messages: Messages,
        Form(creds): Form<Credentials>,
    ) -> impl IntoResponse {
        let user = match auth_session.authenticate(creds.clone()).await {
            Ok(Some(user)) => user,
            Ok(None) => {
                messages.error("Invalid credentials");

                let mut login_url = "/login".to_string();
                if let Some(next) = creds.next {
                    login_url = format!("{}?next={}", login_url, next);
                };

                return Redirect::to(&login_url).into_response();
            }
            Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        };

        if auth_session.login(&user).await.is_err() {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }

        messages.success(format!("Successfully logged in as {}", user.username));

        if let Some(ref next) = creds.next {
            Redirect::to(next)
        } else {
            Redirect::to("/")
        }
        .into_response()
    }

    pub async fn signup(
        State(state): State<AppState>,
        messages: Messages,
        Form(creds): Form<User>,
    ) -> impl IntoResponse {
        let db = state.pool;

        if creds.username.trim().is_empty() {
            messages.error("Username cannot be empty.");
            return Redirect::to("/signup").into_response(); // Redirect back to signup
        }
        if creds.password.len() < 8 {
            messages.error("Password must be at least 8 characters long.");
            return Redirect::to("/signup").into_response();
        }

        // --- Check if username or email already exists ---
        let existing_user_check: Result<Option<i32>, sqlx::Error> =
            sqlx::query_scalar("SELECT 1 FROM users WHERE username = $1 LIMIT 1")
                .bind(&creds.username)
                .bind(&creds.email)
                .fetch_optional(&db)
                .await;

        match existing_user_check {
            Ok(Some(_)) => {
                warn!(
                    "Signup attempt with existing username/email: {} / {}",
                    creds.username, creds.email
                );
                messages.error("Username or email already taken. Please choose another or login.");
                return Redirect::to("/signup").into_response();
            }
            Err(e) => {
                error!("Database error checking existing user: {:?}", e);
                messages.error("An unexpected error occurred. Please try again.");
                return Redirect::to("/signup").into_response();
            }
            Ok(None) => {}
        }

        let password_hash = generate_hash(creds.password);

        let insert_result =
            sqlx::query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)")
                .bind(&creds.username)
                .bind(&creds.email)
                .bind(&password_hash)
                .execute(&db)
                .await;

        match insert_result {
            Ok(result) => {
                if result.rows_affected() == 1 {
                    info!("New user created: {}", creds.username);
                    messages.info("Account created successfully! You can now log in.");
                    // Redirect to login page or a "welcome" page
                    Redirect::to("/login").into_response()
                } else {
                    error!(
                        "User creation did not affect any rows for user: {}",
                        creds.username
                    );
                    messages.error("Could not create your account due to an unexpected issue. Please try again.");
                    Redirect::to("/signup").into_response()
                }
            }
            Err(e) => {
                // Handle specific database errors, e.g., unique constraint violation
                // (though the earlier check should catch most username/email conflicts)
                error!("Database error inserting new user: {:?}", e);
                messages.error("An error occurred while creating your account. Please try again.");
                Redirect::to("/signup").into_response()
            }
        }
    }
}
