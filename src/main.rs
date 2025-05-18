mod db;
mod handler;
mod public;
mod types;
mod users;

use axum::{routing::get, Router};
use handler::{add_prompt, handle_add_prompt, index, specific_prompt};
use migration::{Migrator, MigratorTrait};
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

    Migrator::up(&db, None).await?;

    let app = Router::new()
        .route("/", get(index))
        .route("/js/htmx.min.js", get(public::htmx))
        .route("/style.css", get(public::css))
        .route("/prompt/new", get(add_prompt).post(handle_add_prompt))
        .route("/prompt/{prompt_id}", get(specific_prompt))
        .with_state(db);

    info!("Starting server...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
