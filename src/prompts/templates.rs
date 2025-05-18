use askama::Template;

use super::PromptData;

#[derive(Template)]
#[template(path = "list_prompt.html")]
pub struct ListTemplate {
    pub prompts: Vec<PromptData>,
}
