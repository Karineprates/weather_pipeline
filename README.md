🌦️ Weather Pipeline – Pipeline Climático com IA

Por: Karine Prates da Silva
Cidade monitorada: Florianópolis – SC

<p align="left"> <img src="https://img.shields.io/badge/Python-Producer-blue?logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/Go-Worker-00ADD8?logo=go&logoColor=white" /> <img src="https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&logoColor=white" /> <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black" /> <img src="https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white" /> <img src="https://img.shields.io/badge/RabbitMQ-Broker-FF6600?logo=rabbitmq&logoColor=white" /> <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/Open--Meteo-Weather%20API-blue" /> <img src="https://img.shields.io/badge/Status-Completed-brightgreen" /> </p>

<p align="center">
  <img src="https://i.imgur.com/EaF7Smm.png" alt="Dashboard meteorológico" width="49%" />
  <img src="https://i.imgur.com/eH76Fx6.png" alt="Gráficos de temperatura, umidade e vento" width="49%" />
</p>

## Introdução
O **Weather Pipeline** coleta, processa, armazena e exibe dados reais de clima usando uma arquitetura moderna baseada em microserviços. A solução atende ao desafio **GDASH 2025/02**, integrando:

- **Python** → produtor de dados climáticos
- **RabbitMQ** → mensageria
- **Go** → worker para consumir e enviar para API
- **NestJS + MongoDB** → backend e armazenamento
- **React + Vite + Tailwind** → dashboard com insights de IA
- **Docker Compose** → orquestração completa

## Requisitos
- Docker
- Docker Compose
- (Execução manual) Python 3.11+, Go 1.21+, Node.js 18+ e npm

## Configuração do Ambiente
Crie os arquivos `.env` em cada serviço antes de executar.

### Backend (`backend/.env`)
```env
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
```

### Producer em Python (`python-producer/.env`)
```env
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
RABBITMQ_QUEUE=weather_queue

CITY=Florianópolis
LATITUDE=-27.5935
LONGITUDE=-48.55854

INTERVAL=3600
```

### Worker em Go (`worker-go/.env`)
```env
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
RABBITMQ_QUEUE=weather_queue
API_URL=http://api:3000/api/weather/logs
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000/api
```

### Checklist do desafio
- [x] Rodar tudo via Docker Compose
- [x] Rodar o serviço Python (producer)
- [x] Rodar o worker Go
- [x] URLs principais (API, frontend, Swagger, etc.)
- [x] Usuário padrão para acesso inicial

## Como rodar tudo via Docker Compose
1. Clonar o repositório (caso ainda não tenha):
   ```bash
   git clone https://github.com/Karineprates/weather_pipeline.git
   cd weather_pipeline
   ```
2. Criar os arquivos `.env` conforme a seção anterior.
3. Subir toda a stack com build:
   ```bash
   docker compose up --build
   ```
4. Para parar os serviços:
   ```bash
   docker compose down
   ```

## Execução manual por serviço (sem Docker)
### 🐍 Como rodar o serviço Python (Producer)
```bash
cd python-producer
pip install -r requirements.txt
python producer.py
```
> As variáveis em `.env` são carregadas automaticamente; ajuste a cidade ou coordenadas se necessário.

### 🐹 Como rodar o worker Go
```bash
cd worker-go
go mod tidy
go run main.go
```
> O `.env` é lido na inicialização; confirme `API_URL` apontando para o backend ativo.

### 🟣 Como rodar o backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### 🔵 Como rodar o frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## Arquitetura Geral
```mermaid
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
```

## Pipeline de Dados
1. **Python Producer → RabbitMQ**
   - Coleta clima da Open-Meteo (Florianópolis)
   - Normaliza JSON e envia para `weather_queue`
2. **Go Worker → API**
   - Consome a fila, valida/normaliza e envia para `/api/weather/logs`
3. **API NestJS → MongoDB**
   - Armazena registros, expõe endpoints com autenticação JWT e exportação CSV/XLSX
   - Disponibiliza insights de IA
4. **React Dashboard**
   - Exibe cards, tabelas, gráficos, insights e previsão paginada

## URLs Principais
| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API NestJS | http://localhost:3000/api |
| Swagger (opcional) | http://localhost:3000/api/docs |
| RabbitMQ UI | http://localhost:15672 |
| MongoDB | mongodb://localhost:27017 |

**Usuário e credenciais padrão**
- RabbitMQ → `admin` / `admin`
- Usuário inicial (API) → `admin@example.com` / `admin123`

## Estrutura de Pastas
```
weather_pipeline/
├── backend/
├── frontend/
├── python-producer/
├── worker-go/
├── docker-compose.yml
└── README.md
```

## Demonstração (opcional)
Assista a uma prévia do pipeline em funcionamento: https://youtu.be/kOX91cdCNpY

## Autora
Karine Prates da Silva  
Desenvolvedora Full Stack  
Python • Go • TypeScript • React • NestJS • DevOps
