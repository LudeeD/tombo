use axum_login::{AuthUser, AuthnBackend, UserId};
use entity::user::Model as User;

impl AuthUser for User {
    type Id = i64;

    fn id(&self) -> Self::Id {
        self.id()
    }

    fn session_auth_hash(&self) -> &[u8] {
        self.password.as_bytes()
    }
}
