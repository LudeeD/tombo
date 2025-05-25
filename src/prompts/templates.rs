use askama::Template;

use super::{PromptData, PromptList};

#[derive(Template)]
#[template(path = "list_prompt.html")]
pub struct ListTemplate {
    pub user_logged_in: bool,
    pub prompts: Vec<PromptList>,
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
    pub user_logged_in: bool,
    pub prompt: PromptData,
    pub comments: Vec<Comment>,
}
