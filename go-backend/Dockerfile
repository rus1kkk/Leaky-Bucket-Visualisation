# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

# Final stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .

ENV ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["./main"] 