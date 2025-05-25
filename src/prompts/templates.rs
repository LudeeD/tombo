use askama::Template;

use super::{PromptData, PromptList, PromptListReady, Tag};

pub struct PromptTag {
    pub prompt_id: i64,
    pub id: i64,
    pub name: String,
    pub bg_color: String,
    pub text_color: String,
    pub kind: String,
}

#[derive(Template)]
#[template(path = "list_prompt.html")]
pub struct ListTemplate {
    pub user: Option<i64>,
    pub tags: Vec<Tag>,
    pub prompts: Vec<PromptListReady>,
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
