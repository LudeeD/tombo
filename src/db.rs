use sqlx::{postgres::PgPoolOptions, PgPool};

pub async fn pool_from_env() -> PgPool {
    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL not set");
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("could not connect to postgres")
}
