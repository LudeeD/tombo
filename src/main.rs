mod api;
mod db;
mod prompts;
mod users;

use axum::{
    http::{header, HeaderValue, Method},
    routing::{get, post},
    Router,
};
use axum_login::{
    login_required,
    tower_sessions::{ExpiredDeletion, Expiry, SessionManagerLayer},
    AuthManagerLayerBuilder,
};
use axum_messages::MessagesManagerLayer;
use db::{pool_from_env, seed};
use memory_serve::{load_assets, MemoryServe};
use sqlx::SqlitePool;
use time::Duration;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tower_sessions::cookie::Key;
use tower_sessions_sqlx_store::SqliteStore;
use tracing::info;
use users::Backend;

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let pool = pool_from_env().await;

    sqlx::migrate!("./migrations").run(&pool).await?;

    seed(pool.clone()).await;

    let session_store = SqliteStore::new(pool.clone());
    session_store.migrate().await?;

    let deletion_task = tokio::task::spawn(
        session_store
            .clone()
            .continuously_delete_expired(tokio::time::Duration::from_secs(60)),
    );

    let key = Key::generate();

    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(true)
        .with_same_site(tower_sessions::cookie::SameSite::None)
        .with_expiry(Expiry::OnInactivity(Duration::days(1)))
        .with_signed(key);

    let backend = Backend::new(pool.clone());
    let auth_layer = AuthManagerLayerBuilder::new(backend, session_layer).build();

    let state = AppState { pool: pool };

    let prod = String::from("PROD") == std::env::var("ENV").unwrap_or_default();
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

    let static_memory_router = MemoryServe::new(load_assets!("./public")).into_router();

    let app = Router::new()
        .route("/dashboard", get(prompts::handlers::list))
        .route(
            "/prompt/new",
            get(prompts::handlers::add_prompt).post(prompts::handlers::create),
        )
        .route_layer(login_required!(Backend, login_url = "/login"))
        .route("/api/prompts", get(api::prompts::list))
        .route("/api/profile", get(users::handlers::get::profile))
        .route("/", get(prompts::handlers::list))
        .route("/prompt/{prompt_id}", get(prompts::handlers::detail))
        .route(
            "/prompt/{prompt_id}/tags/edit",
            get(prompts::handlers::tag_edit),
        )
        .route(
            "/prompt/{prompt_id}/tags",
            post(prompts::handlers::add_tags),
        )
        .route("/prompt/{prompt_id}/raw", get(prompts::handlers::raw))
        .route(
            "/signup",
            get(users::handlers::get::signup).post(users::handlers::post::signup),
        )
        .route(
            "/login",
            get(users::handlers::get::login).post(users::handlers::post::login),
        )
        .route("/logout", get(users::handlers::get::logout))
        .with_state(state)
        .merge(static_memory_router)
        .layer(MessagesManagerLayer)
        .layer(cors)
        .layer(auth_layer);

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    deletion_task.await.unwrap().unwrap();

    Ok(())
}
