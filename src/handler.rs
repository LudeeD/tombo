use crate::AppState;
use askama::Template;
use axum::extract::{Form, Path};
use axum::{
    extract::State,
    response::{Html, IntoResponse},
};
use uuid::Uuid;

#[derive(Template)]
#[template(path = "add_prompt.html")]
pub struct AddPromptTemplate {}

#[derive(Template)]
#[template(path = "details_prompt.html")]
pub struct PromptRowTemplate {}

pub async fn specific_prompt(Path(prompt_id): Path<Uuid>) -> impl IntoResponse {
    let template = PromptRowTemplate {};
    Html(template.render().expect("Failed to render prompt row"))
}

pub async fn add_prompt() -> impl IntoResponse {
    let template = AddPromptTemplate {};
    Html(template.render().expect("Failed to render add prompt form"))
}

// pub async fn handle_add_prompt(
//     State(db): State<DatabaseConnection>,
//     Form(form): Form<NewPromptForm>,
// ) -> impl IntoResponse {
//     // Extract form data, using empty string for optional fields if not provided
//     let title = form.title;
//     let content = form.content;
//     let description = form.description.unwrap_or_default();

//     let tags = form.tags.unwrap_or_default();

//     info!("TODO: implement tags {tags}");

//     let prompt = prompt::ActiveModel {
//         title: Set(title),
//         content: Set(content),
//         description: Set(description),
//         created_at: Set(Utc::now()),
//         instructions: Set(String::new()),

//         ..Default::default() // all other attributes are `NotSet`
//     };

//     let _prompt: prompt::Model = prompt.insert(&db).await.unwrap();

//     "Success"
// }
