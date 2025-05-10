mod db;
mod handler;
mod public;
mod types;

use axum::{routing::get, Router};
use handler::{add_prompt, handle_signup, index, login_page, signup_page, specific_prompt};
use tracing::info;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let pool = db::pool_from_env().await;

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run the migrations");

    info!("Migrations completed successfully!");

    let app = Router::new()
        .route("/", get(index))
        .route("/login", get(login_page))
        .route("/signup", get(signup_page).post(handle_signup))
        // .route("/discover", get(index))
        // .route("/dashboard", get(index))
        .route("/js/htmx.min.js", get(public::htmx))
        .route("/style.css", get(public::css))
        .route("/prompt/new", get(add_prompt))
        .route("/prompt/{prompt_id}", get(specific_prompt))
        .with_state(pool);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
