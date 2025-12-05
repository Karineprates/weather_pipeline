🌦️ Weather Pipeline – Sistema Completo de Monitoramento Climático

Este projeto implementa um pipeline completo para coleta, processamento, armazenamento e visualização de dados climáticos em tempo real.
Foi desenvolvido como parte de um desafio técnico, integrando diferentes linguagens, serviços e tecnologias modernas.

🚀 Funcionalidades
🔵 Coleta de Dados (Python)

Consulta periódica à API de clima (Open-Meteo/OpenWeather)

Normalização dos dados

Envio das informações para a fila (RabbitMQ)

🟢 Processamento (Go Worker)

Consumo das mensagens da fila

Validação e transformação dos dados

Envio dos registros para a API NestJS

Tratamento de erros, retry e logs

🟡 API Backend (NestJS + MongoDB)

Armazenamento dos dados climáticos

Endpoints para listagem, gráficos e histórico

Exportação para CSV e XLSX

Geração de Insights com IA

CRUD de usuários + autenticação JWT

Integração opcional com uma API pública paginada

🟣 Frontend (React + Vite + Tailwind + shadcn/ui)

Dashboard completo com:

Dados atuais

Tabela de registros

Gráficos interativos

Insights de IA

Botões de exportação

Login e rotas protegidas

CRUD de usuários

Página opcional consumindo uma API pública