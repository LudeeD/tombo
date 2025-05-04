mod db;
mod handler;
mod public;

use axum::{routing::get, Router};
use handler::index;
use tracing::info;

#[tokio::main]
async fn main() {
    println!("demo");
    tracing_subscriber::fmt::init();

    let pool = db::pool_from_env().await;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run the migrations");

    info!("Migrations completed successfully!");

    let app = Router::new()
        .route("/", get(index))
        .route("/discover", get(index))
        .route("/dashboard", get(index))
        .route("/js/htmx.min.js", get(public::htmx))
        .route("/style.css", get(public::css))
        // .route("/prompts", post(create_prompt))
        .with_state(pool);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
