package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/streadway/amqp"
)

type MessagePayload struct {
	Pattern string          `json:"pattern"`
	Data    json.RawMessage `json:"data"`
}

type WeatherPayload struct {
	Temperature   float64 `json:"temperature"`
	Humidity      float64 `json:"humidity"`
	WindSpeed     float64 `json:"windSpeed"`
	Pressure      float64 `json:"pressure"`
	Precipitation float64 `json:"precipitation"`
	RainChance    float64 `json:"rainChance"`
	Description   string  `json:"description"`
	City          string  `json:"city"`
	Timestamp     string  `json:"timestamp"`
}

func main() {
	rabbitURL := envOrDefault("RABBITMQ_URL", "amqp://admin:admin@rabbitmq:5672/")
	apiURL := envOrDefault("API_URL", "http://api:3000/api/weather/logs")
	queueName := envOrDefault("RABBITMQ_QUEUE", "weather_queue")

	log.Println("Iniciando Worker Go – aguardando conexão ao RabbitMQ...")

	var conn *amqp.Connection
	var ch *amqp.Channel

	for {
		var err error
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			ch, err = conn.Channel()
			if err == nil {
				break
			}
		}
		log.Printf("RabbitMQ não disponível... tentando em 3s (%v)", err)
		time.Sleep(3 * time.Second)
	}
	defer conn.Close()
	defer ch.Close()

	if _, err := ch.QueueDeclare(queueName, true, false, false, false, nil); err != nil {
		log.Fatal("Erro ao declarar fila:", err)
	}

	msgs, err := ch.Consume(queueName, "go-worker", false, false, false, false, nil)
	if err != nil {
		log.Fatal("Erro no Consume:", err)
	}

	log.Println("Worker Go ativo! Escutando fila:", queueName)

	for msg := range msgs {
		handleMessage(msg, apiURL)
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func handleMessage(msg amqp.Delivery, apiURL string) {
	var payload MessagePayload
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		log.Println("Erro: mensagem inválida:", err)
		_ = msg.Nack(false, false)
		return
	}

	if payload.Pattern != "weather_created" {
		log.Printf("Ignorando pattern desconhecido: %s", payload.Pattern)
		_ = msg.Ack(false)
		return
	}

	weather, err := normalizeWeather(payload.Data)
	if err != nil {
		log.Println("Descartando mensagem inválida:", err)
		_ = msg.Ack(false)
		return
	}

	if err := postWeatherWithRetry(apiURL, weather, 3); err != nil {
		log.Printf("❌ Falha ao enviar para API: %v", err)
		_ = msg.Nack(false, true)
		return
	}

	log.Printf("✔ Enviado para API | %.1f°C | %s", weather.Temperature, weather.City)
	_ = msg.Ack(false)
}

func normalizeWeather(raw json.RawMessage) (*WeatherPayload, error) {
	var input WeatherPayload
	if err := json.Unmarshal(raw, &input); err != nil {
		return nil, fmt.Errorf("json inválido: %w", err)
	}

	if input.City == "" {
		return nil, errors.New("cidade obrigatória")
	}

	if input.Timestamp == "" {
		input.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	if _, err := time.Parse(time.RFC3339, input.Timestamp); err != nil {
		return nil, fmt.Errorf("timestamp inválido: %w", err)
	}

	return &input, nil
}

func postWeatherWithRetry(apiURL string, payload *WeatherPayload, attempts int) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}

	for i := 1; i <= attempts; i++ {
		resp, err := client.Post(apiURL, "application/json", bytes.NewBuffer(body))
		if err != nil {
			log.Printf("Tentativa %d/%d falhou: %v", i, attempts, err)
		} else {
			respBody, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				return nil
			}

			log.Printf("API retornou %d: %s", resp.StatusCode, string(respBody))
		}

		if i < attempts {
			backoff := time.Duration(i) * 2 * time.Second
			time.Sleep(backoff)
		}
	}

	return fmt.Errorf("falha após %d tentativas", attempts)
}
