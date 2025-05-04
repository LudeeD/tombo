# ---------- build stage ----------
FROM rust:1.86 AS builder
WORKDIR /app

COPY . .
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked

# ---------- runtime stage ----------
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/target/release/tombo /usr/local/bin/tombo
ENV RUST_LOG=info
EXPOSE 3000
CMD ["tombo"]
