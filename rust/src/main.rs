use axum::{Router, routing::get};

#[tokio::main]
async fn main() {
    // 1. Build our application with a single route
    let app = Router::new().route("/", get(|| async { "Hello, World!" }));

    // 2. Run it with hyper on localhost:3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();

    println!("Listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
