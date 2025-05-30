# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o main .

# Final stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
COPY --from=builder /app/react-frontend/build ./react-frontend/build

ENV ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["./main"] 