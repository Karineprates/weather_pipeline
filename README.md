🌦️ Weather Pipeline – Pipeline Climático com IA

Por: Karine Prates da Silva
Cidade monitorada: Florianópolis – SC

<p align="left"> <img src="https://img.shields.io/badge/Python-Producer-blue?logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/Go-Worker-00ADD8?logo=go&logoColor=white" /> <img src="https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&logoColor=white" /> <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black" /> <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white" /> <img src="https://img.shields.io/badge/RabbitMQ-Broker-FF6600?logo=rabbitmq&logoColor=white" /> <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/Open--Meteo-Weather%20API-blue" /> <img src="https://img.shields.io/badge/Status-Completed-brightgreen" /> </p>
📘 Sobre o Projeto

O Weather Pipeline é um ecossistema completo que coleta, processa, armazena e exibe dados reais de clima usando uma arquitetura moderna baseada em microserviços.

Toda solução atende aos requisitos do Desafio GDASH 2025/02, integrando:

Python → produtor de dados climáticos

RabbitMQ → mensageria

Go → worker para consumir e enviar para API

NestJS + MongoDB → backend e armazenamento

React + Vite + Tailwind → dashboard com insights de IA

Docker Compose → orquestra tudo automaticamente

🏗️ Arquitetura Geral
graph LR
    subgraph COLETA
        P[Python Producer<br>Coleta da Open-Meteo] --> Q[(RabbitMQ)]
    end

    subgraph PROCESSAMENTO
        Q --> W[Go Worker<br>Valida & Envia para API]
        W --> A[NestJS API<br>CRUD + Insights + Export]
    end

    subgraph ARMAZENAMENTO
        A --> M[(MongoDB)]
    end

    subgraph DASHBOARD
        A --> F[React + Vite Dashboard]
    end

🔄 Pipeline de Dados
1️⃣ Python Producer → RabbitMQ

Coleta de clima da Open-Meteo (Florianópolis)

Normaliza JSON

Envia para weather_queue

2️⃣ Go Worker → API

Consome a fila

Valida e normaliza dados

Envia para /api/weather/logs

3️⃣ API NestJS → MongoDB

Armazena registros

Exposição de endpoints

Autenticação JWT

Exportação CSV/XLSX

Insights de IA

4️⃣ React Dashboard

Cards, tabelas, gráficos

Insights inteligentes

Página de previsão paginada

🧠 Insights de IA

Gerados em:

GET /api/weather/insights


Inclui:

Médias (temp, umidade, vento)

Tendência (subindo / caindo / estável)

Comfort Score (0–100)

Cards inteligentes:

info

warning

critical

positive

Alertas automáticos

Recomendações práticas

Resumo automático

Modo prompt:

POST /api/weather/insights

🐳 Como Rodar o Projeto (Docker Compose)

📌 Pré-requisitos:

Docker instalado

Docker Compose instalado

1️⃣ Clonar repositório
git clone https://github.com/Karineprates/weather_pipeline.git
cd weather_pipeline

2️⃣ Criar arquivos .env nos serviços
📍 backend/.env
MONGO_URI=mongodb://root:root@mongo:27017/weather?authSource=admin
JWT_SECRET=supersecretjwtkey
PORT=3000

RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
RABBITMQ_QUEUE=weather_queue

DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin123

EXTERNAL_LATITUDE=-27.5935
EXTERNAL_LONGITUDE=-48.55854
EXTERNAL_TIMEZONE=auto

📍 python-producer/.env
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
RABBITMQ_QUEUE=weather_queue

CITY=Florianópolis
LATITUDE=-27.5935
LONGITUDE=-48.55854

INTERVAL=3600

📍 frontend/.env
VITE_API_URL=http://localhost:3000/api

3️⃣ Subir tudo
docker compose up --build

▶️ Rodar Manualmente (sem Docker)
🐍 Rodar o Producer (Python)
cd python-producer
pip install -r requirements.txt
python producer.py

🐹 Rodar o Worker Go
cd worker-go
go mod tidy
go run main.go

🟣 Rodar o Backend NestJS
cd backend
npm install
npm run start:dev

🔵 Rodar o Frontend
cd frontend
npm install
npm run dev

🌐 URLs Principais
Serviço	URL
Frontend	http://localhost:5173

API NestJS	http://localhost:3000/api

Swagger (opcional)	http://localhost:3000/api/docs

RabbitMQ UI	http://localhost:15672

MongoDB	mongodb://localhost:27017

Credenciais do RabbitMQ:

username: admin
password: admin

🔑 Usuário Padrão (Login)

Gerado automaticamente no primeiro boot:

Email: admin@example.com
Senha: admin123

📁 Estrutura de Pastas
weather_pipeline/
├── backend/
├── frontend/
├── python-producer/
├── worker-go/
├── docker-compose.yml
└── README.md

🎥 Vídeo de Apresentação

Insira o link do YouTube (não listado):

https://youtu.be/SEU_VIDEO_AQUI

👤 Autora

Karine Prates da Silva
Desenvolvedora Full Stack
Python • Go • TypeScript • React • NestJS • DevOps