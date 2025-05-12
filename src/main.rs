mod db;
mod handler;
mod public;
mod types;

use axum::{routing::get, Router};
use handler::{add_prompt, index, specific_prompt};
use tracing::info;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // check size of /var/lib/data
    let data_dir = "/var/lib/data";
    let data_size = std::fs::metadata(data_dir);
    info!("Metadata: {:?}", data_size);

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
}
