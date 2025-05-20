use askama::Template;

use super::PromptData;

#[derive(Template)]
#[template(path = "list_prompt.html")]
pub struct ListTemplate {
    pub prompts: Vec<PromptData>,
}

pub struct Comment {
    id: i64,
    body: String,
    created_at: String,
    author_id: i64,
    author_name: String,
}

#[derive(Template)]
#[template(path = "details_prompt.html")]
pub struct DetailTemplate {
    pub current_user_id: i64,
    pub prompt: PromptData,
    pub comments: Vec<Comment>,
}
