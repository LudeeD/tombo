# ---------- build stage ----------
FROM rust:1.86 AS builder
WORKDIR /app

# populate dependency cache
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# build real binary
COPY . .
RUN cargo build --release

# ---------- runtime stage ----------
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/tombo /usr/local/bin/tombo

ENV RUST_LOG=info
EXPOSE 8080
CMD ["tombo"]
