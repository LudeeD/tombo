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

pub async fn seed(pool: SqlitePool) {
    info!("Seeding Database");

    const DEFAULT_TAGS: &[(&str, &str, &str, &str)] = &[
        ("Writing", "category", "F0DFFF", "46006E"),
        ("Brainstorming", "category", "FFEBCD", "783C00"),
        ("Role-playing", "category", "E0FFF5", "006450"),
        ("Summary", "category", "DAEDFF", "00468C"),
        ("System", "category", "FFF5C8", "786400"),
        ("Games", "category", "D0F2FF", "005A78"),
    ];

    for tag in DEFAULT_TAGS {
        sqlx::query!(
            r#"INSERT OR IGNORE INTO tags (name, kind, bg_color, text_color) VALUES ($1, $2 ,$3, $4);"#,
            tag.0, tag.1, tag.2, tag.3
        )
        .execute(&pool)
        .await.expect("Failed to seed the DB");
    }
}
