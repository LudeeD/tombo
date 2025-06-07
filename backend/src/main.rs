use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{
    extract::State,
    http::{header, HeaderValue, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::collections::HashSet;
use time::{Duration, OffsetDateTime};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::info;

static JWT_SECRET: Lazy<String> =
    Lazy::new(|| std::env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string()));

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: i64,
    iat: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct User {
    id: i64,
    username: String,
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    access_token: String,
    refresh_token: String,
    user: User,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Debug, Serialize)]
struct Prompt {
    id: i64,
    title: String,
    content: String,
    description: String,
    created_at: String,
}

#[derive(Debug, Clone)]
struct AppState {
    db: SqlitePool,
}

fn generate_jwt(user_id: &str, is_refresh: bool) -> Result<String, jsonwebtoken::errors::Error> {
    let now = OffsetDateTime::now_utc();
    let duration = if is_refresh {
        Duration::days(30)
    } else {
        Duration::hours(1)
    };

    let claims = Claims {
        sub: user_id.to_string(),
        exp: (now + duration).unix_timestamp(),
        iat: now.unix_timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    )
}

fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.required_spec_claims = HashSet::new();

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_ref()),
        &validation,
    )
    .map(|data| data.claims)
}

async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    let user_row = sqlx::query("SELECT id, username, password FROM users WHERE username = ?")
        .bind(&payload.username)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let user_row = user_row.ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid credentials".to_string(),
            }),
        )
    })?;

    let user_id: i64 = user_row.get("id");
    let username: String = user_row.get("username");
    let stored_hash: String = user_row.get("password");

    let parsed_hash = PasswordHash::new(&stored_hash).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Invalid password hash".to_string(),
            }),
        )
    })?;

    Argon2::default()
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "Invalid credentials".to_string(),
                }),
            )
        })?;

    let user_id_str = user_id.to_string();
    let access_token = generate_jwt(&user_id_str, false).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate access token".to_string(),
            }),
        )
    })?;

    let refresh_token = generate_jwt(&user_id_str, true).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to generate refresh token".to_string(),
            }),
        )
    })?;

    Ok(Json(LoginResponse {
        access_token,
        refresh_token,
        user: User {
            id: user_id,
            username,
        },
    }))
}

async fn get_prompts_handler(
    State(state): State<AppState>,
) -> Result<Json<Vec<Prompt>>, (StatusCode, Json<ErrorResponse>)> {
    let rows = sqlx::query("SELECT id, title, content, description, created_at FROM prompts ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error".to_string(),
                }),
            )
        })?;

    let prompts: Vec<Prompt> = rows
        .into_iter()
        .map(|row| Prompt {
            id: row.get("id"),
            title: row.get("title"),
            content: row.get("content"),
            description: row.get("description"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(prompts))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:db.sqlite".to_string());
    let db = SqlitePool::connect(&database_url).await?;

    sqlx::migrate!("./migrations").run(&db).await?;

    let state = AppState { db };
    let prod = std::env::var("PROD").is_ok();

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(
            move |origin: &HeaderValue, _request_parts| {
                let origin_str = origin.to_str().unwrap_or("");

                // Always allow browser extensions
                if origin_str.starts_with("moz-extension://")
                    || origin_str.starts_with("chrome-extension://")
                {
                    return true;
                }

                // Allow production domain
                if origin_str == "https://tombotower.eu" {
                    return true;
                }

                // Allow localhost in development
                if !prod
                    && (origin_str.starts_with("http://localhost")
                        || origin_str.starts_with("http://127.0.0.1"))
                {
                    return true;
                }

                false
            },
        ))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT, header::AUTHORIZATION])
        .allow_credentials(true);

    let app = Router::new()
        .route("/session", post(login_handler))
        .route("/prompts", get(get_prompts_handler))
        .layer(cors)
        .with_state(state);

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
