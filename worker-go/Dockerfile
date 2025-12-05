# worker-go/Dockerfile – build final otimizado
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Dependências
COPY go.mod go.sum ./
RUN go mod download

# Código fonte
COPY . .
RUN go build -o worker main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/worker ./worker

CMD ["./worker"]
