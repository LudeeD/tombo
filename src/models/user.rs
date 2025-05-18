#[derive(Serialize, ToSchema)]
pub struct UserData {
    pub id: String,
    pub username: String,
    pub email: String,
}
