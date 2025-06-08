use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderValue, Method, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
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
struct HealthResponse {
    status: String,
    version: String,
    timestamp: String,
}

#[derive(Debug, Serialize)]
struct Tag {
    id: i64,
    name: String,
    bg_color: String,
    text_color: String,
    kind: String,
}

#[derive(Debug, Serialize)]
struct PromptAuthor {
    id: i64,
    username: String,
}

#[derive(Debug, Serialize)]
struct Prompt {
    id: i64,
    title: String,
    content: String,
    description: String,
    created_at: String,
    user_id: Option<i64>,
    parent_prompt_id: Option<i64>,
    author: Option<PromptAuthor>,
    tags: Vec<Tag>,
    star_count: i64,
    is_starred: Option<bool>, // Will be Some(bool) if user is authenticated
}

#[derive(Debug, Deserialize)]
struct PromptsQuery {
    limit: Option<i64>,
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

// Note: JWT verification can be added later for protected routes
// fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
//     let mut validation = Validation::new(Algorithm::HS256);
//     validation.required_spec_claims = HashSet::new();

//     decode::<Claims>(
//         token,
//         &DecodingKey::from_secret(JWT_SECRET.as_ref()),
//         &validation,
//     )
//     .map(|data| data.claims)
// }

async fn health_handler() -> Json<HealthResponse> {
    let version = env!("CARGO_PKG_VERSION");
    let timestamp = OffsetDateTime::now_utc().to_string();
    
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: version.to_string(),
        timestamp,
    })
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
    Query(params): Query<PromptsQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Prompt>>, (StatusCode, Json<ErrorResponse>)> {
    let limit_clause = if let Some(limit) = params.limit {
        format!("LIMIT {}", limit)
    } else {
        String::new()
    };

    let query = format!(
        "SELECT p.id, p.title, p.content, p.description, p.created_at, p.user_id, p.parent_prompt_id, 
                u.username as author_username,
                (SELECT COUNT(*) FROM prompt_stars ps WHERE ps.prompt_id = p.id) as star_count
         FROM prompts p
         LEFT JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC
         {}", limit_clause
    );

    let rows = sqlx::query(&query)
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

    let mut prompts = Vec::new();
    
    for row in rows {
        let prompt_id: i64 = row.get("id");
        
        // Fetch tags for each prompt (could be optimized with a single query for all prompts)
        let tag_rows = sqlx::query(
            "SELECT t.id, t.name, t.bg_color, t.text_color, t.kind
             FROM tags t
             JOIN prompt_tags pt ON t.id = pt.tag_id
             WHERE pt.prompt_id = ?"
        )
        .bind(prompt_id)
        .fetch_all(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error fetching tags".to_string(),
                }),
            )
        })?;

        let tags: Vec<Tag> = tag_rows
            .into_iter()
            .map(|tag_row| Tag {
                id: tag_row.get("id"),
                name: tag_row.get("name"),
                bg_color: tag_row.get("bg_color"),
                text_color: tag_row.get("text_color"),
                kind: tag_row.get("kind"),
            })
            .collect();

        // Build author information if available
        let author = if let Some(user_id) = row.get::<Option<i64>, _>("user_id") {
            if let Some(username) = row.get::<Option<String>, _>("author_username") {
                Some(PromptAuthor {
                    id: user_id,
                    username,
                })
            } else {
                None
            }
        } else {
            None
        };

        let prompt = Prompt {
            id: row.get("id"),
            title: row.get("title"),
            content: row.get("content"),
            description: row.get("description"),
            created_at: row.get("created_at"),
            user_id: row.get("user_id"),
            parent_prompt_id: row.get("parent_prompt_id"),
            author,
            tags,
            star_count: row.get("star_count"),
            is_starred: None, // TODO: Check if current user has starred this prompt
        };

        prompts.push(prompt);
    }

    Ok(Json(prompts))
}

async fn get_prompt_by_id_handler(
    Path(id): Path<i64>,
    State(state): State<AppState>,
) -> Result<Json<Prompt>, (StatusCode, Json<ErrorResponse>)> {
    // Fetch the main prompt data with author information
    let prompt_row = sqlx::query(
        "SELECT p.id, p.title, p.content, p.description, p.created_at, p.user_id, p.parent_prompt_id, 
                u.username as author_username
         FROM prompts p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ?"
    )
    .bind(id)
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

    let prompt_row = prompt_row.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Prompt not found".to_string(),
            }),
        )
    })?;

    // Fetch tags for this prompt
    let tag_rows = sqlx::query(
        "SELECT t.id, t.name, t.bg_color, t.text_color, t.kind
         FROM tags t
         JOIN prompt_tags pt ON t.id = pt.tag_id
         WHERE pt.prompt_id = ?"
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Database error fetching tags".to_string(),
            }),
        )
    })?;

    let tags: Vec<Tag> = tag_rows
        .into_iter()
        .map(|row| Tag {
            id: row.get("id"),
            name: row.get("name"),
            bg_color: row.get("bg_color"),
            text_color: row.get("text_color"),
            kind: row.get("kind"),
        })
        .collect();

    // Count stars for this prompt
    let star_count_row = sqlx::query("SELECT COUNT(*) as star_count FROM prompt_stars WHERE prompt_id = ?")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Database error counting stars".to_string(),
                }),
            )
        })?;

    let star_count: i64 = star_count_row.get("star_count");

    // Build author information if available
    let author = if let Some(user_id) = prompt_row.get::<Option<i64>, _>("user_id") {
        if let Some(username) = prompt_row.get::<Option<String>, _>("author_username") {
            Some(PromptAuthor {
                id: user_id,
                username,
            })
        } else {
            None
        }
    } else {
        None
    };

    let prompt = Prompt {
        id: prompt_row.get("id"),
        title: prompt_row.get("title"),
        content: prompt_row.get("content"),
        description: prompt_row.get("description"),
        created_at: prompt_row.get("created_at"),
        user_id: prompt_row.get("user_id"),
        parent_prompt_id: prompt_row.get("parent_prompt_id"),
        author,
        tags,
        star_count,
        is_starred: None, // TODO: Check if current user has starred this prompt
    };

    Ok(Json(prompt))
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
        .route("/health", get(health_handler))
        .route("/session", post(login_handler))
        .route("/prompts", get(get_prompts_handler))
        .route("/prompts/{id}", get(get_prompt_by_id_handler))
        .layer(cors)
        .with_state(state);

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
