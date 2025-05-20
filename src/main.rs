mod db;
mod handler;
mod public;

mod prompts;

use axum::{routing::get, Router};
use db::pool_from_env;
use handler::add_prompt;
use sqlx::SqlitePool;
use tracing::info;

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let pool = pool_from_env().await;

    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = AppState { pool: pool };

    let app = Router::new()
        .route("/", get(prompts::handlers::list))
        .route("/js/htmx.min.js", get(public::htmx))
        .route("/style.css", get(public::css))
        .route("/prompt/new", get(add_prompt))
        .route("/prompt/{prompt_id}", get(prompts::handlers::detail))
        .with_state(state);

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
