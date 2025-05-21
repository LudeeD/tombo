use askama::Template;
use axum::response::{Html, IntoResponse};

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {}

pub async fn add_prompt() -> impl IntoResponse {
    let template = AddPromptTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}
