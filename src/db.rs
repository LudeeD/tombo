use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tracing::info;

pub async fn pool_from_env() -> SqlitePool {
    let prod = String::from("PROD") == std::env::var("ENV").unwrap_or_default();
    let url = format!(
        "sqlite://{}db.sqlite?mode=rwc",
        if prod { "/var/lib/data/" } else { "" }
    );

    info!("DB URL: {url}");

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("could not connect to postgres")
}
