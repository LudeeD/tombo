mod db;
mod handler;
mod public;
mod types;

use axum::{routing::get, Router};
use handler::{add_prompt, index, specific_prompt};
use sea_orm::Database;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let db = if String::from("PROD") == std::env::var("ENV").unwrap_or_default() {
        info!("Running in production mode");
        Database::connect("sqlite:///var/lib/data/db.sqlite?mode=rwc").await?
    } else {
        Database::connect("sqlite://db.sqlite?mode=rwc").await?
    };

    assert!(db.ping().await.is_ok());

    let app = Router::new()
        .route("/", get(index))
        // .route("/login", get(login_page))
        // .route("/signup", get(signup_page).post(handle_signup))
        // .route("/discover", get(index))
        // .route("/dashboard", get(index))
        .route("/js/htmx.min.js", get(public::htmx))
        .route("/style.css", get(public::css))
        .route("/prompt/new", get(add_prompt))
        .route("/prompt/{prompt_id}", get(specific_prompt));

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
