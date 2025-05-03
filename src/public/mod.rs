use axum::{
    body::Body,
    http::{header, Response, StatusCode},
    response::IntoResponse,
};

pub async fn htmx() -> impl IntoResponse {
    static HTMX_JS: &[u8] = include_bytes!("htmx.min.js");

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/javascript")
        .body(Body::from(HTMX_JS))
        .unwrap()
}

pub async fn css() -> impl IntoResponse {
    static CSS: &[u8] = include_bytes!("style.css");

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/css")
        .body(Body::from(CSS))
        .unwrap()
}
