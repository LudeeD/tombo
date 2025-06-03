use crate::{users::AuthSession, AppState};
use axum::extract::State;
use axum::response::Json;
use serde_json::{json, Value};

/// Get user's prompts for the browser extension
pub async fn list(auth_session: AuthSession, State(state): State<AppState>) -> Json<Value> {
    if auth_session.user.is_none() {
        return Json(json!({
            "error": "Not authenticated"
        }));
    }

    let user_id = auth_session.user.unwrap().id;
    let db = &state.pool;

    let prompts = sqlx::query!(
        "SELECT id, title, content FROM prompts WHERE user_id = ? ORDER BY created_at DESC",
        user_id
    )
    .fetch_all(db)
    .await
    .unwrap_or_default();

    let prompt_list: Vec<Value> = prompts
        .into_iter()
        .map(|p| {
            json!({
                "id": p.id,
                "title": p.title,
                "content": p.content
            })
        })
        .collect();

    Json(json!({
        "prompts": prompt_list
    }))
}
