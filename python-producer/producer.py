import json
import os
import time
from datetime import datetime

import pika
import requests
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin@rabbitmq:5672/")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE", "weather_queue")
CITY = os.getenv("CITY", "Florianópolis")
LATITUDE = float(os.getenv("LATITUDE", "-27.5935"))
LONGITUDE = float(os.getenv("LONGITUDE", "-48.55854"))
INTERVAL = int(os.getenv("INTERVAL", "3600"))

WEATHER_CODE_MAP = {
    0: "Céu limpo",
    1: "Parcialmente claro",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro gelado",
    51: "Garoa leve",
    53: "Garoa moderada",
    55: "Garoa densa",
    61: "Chuva fraca",
    63: "Chuva moderada",
    65: "Chuva forte",
    71: "Neve fraca",
    73: "Neve moderada",
    75: "Neve forte",
    95: "Trovoadas",
    96: "Trovoadas com granizo leve",
    99: "Trovoadas com granizo forte",
}


def connect_rabbit():
    while True:
        try:
            print("🔄 Tentando conectar ao RabbitMQ...")
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            print("✅ Conectado ao RabbitMQ!")
            return connection
        except Exception as e:
            print("❌ RabbitMQ indisponível, tentando novamente em 3 segundos:", e)
            time.sleep(3)


def get_weather_from_open_meteo():

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "current": [
            "temperature_2m",
            "relativehumidity_2m",
            "windspeed_10m",
            "weathercode",
            "surface_pressure",
            "precipitation",
            "precipitation_probability",
        ],
        "hourly": ["precipitation"],
        "past_days": 1,
        "forecast_days": 1,
        "timezone": "UTC",
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()
    current = data.get("current", {})
    hourly_precip = data.get("hourly", {}).get("precipitation", [])

    accumulated_precipitation = round(sum(hourly_precip[-24:]), 2)

    payload = {
        "city": CITY,
        "temperature": round(current.get("temperature_2m", 0), 1),
        "humidity": current.get("relativehumidity_2m", 0),
        "windSpeed": current.get("windspeed_10m", 0),
        "pressure": current.get("surface_pressure", 0),
        "precipitation": accumulated_precipitation,
        "rainChance": current.get("precipitation_probability", 0),
        "description": WEATHER_CODE_MAP.get(current.get("weathercode", 0), "Clima"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    return payload


def publish_message(channel, queue_name, message):
    channel.basic_publish(
        exchange="",
        routing_key=queue_name,
        body=json.dumps(message, ensure_ascii=False).encode("utf-8"),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2,
        ),
    )


def main():
    print("Conectando ao RabbitMQ:", RABBITMQ_URL)

    connection = connect_rabbit()
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    print("🌦️ Producer iniciado!")
    print(f"Cidade: {CITY} | Coordenadas: {LATITUDE}, {LONGITUDE}")
    interval_hours = INTERVAL / 3600
    print(
        f"⏱️ Intervalo: {INTERVAL} segundos (~{interval_hours:.1f} horas)"
    )

    try:
        while True:
            try:
                weather = get_weather_from_open_meteo()
                message = {"pattern": "weather_created", "data": weather}

                publish_message(channel, QUEUE_NAME, message)

                print(
                    f"{datetime.now().strftime('%H:%M:%S')} | "
                    f"📤 Enviado | {weather['temperature']}°C | "
                    f"Umidade {weather['humidity']}% | "
                    f"Vento {weather['windSpeed']} km/h | "
                    f"{weather['description']}"
                )

            except Exception as exc:
                print("❌ Erro ao coletar/enviar dados:", exc)

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Producer parado pelo usuário")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
