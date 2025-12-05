🌦️ Weather API – NestJS + MongoDB + JWT Authentication

Uma API REST construída com NestJS, MongoDB Atlas, Autenticação JWT e Controle de Permissões (RBAC).
O sistema permite que usuários consultem informações climáticas e que administradores possam criar, editar e excluir registros.

🚀 Tecnologias Utilizadas

Node.js

NestJS

MongoDB / Mongoose

Passport JWT

Class Validator / Class Transformer

Bcrypt

Docker (opcional)

📦 Funcionalidades
🔐 Autenticação & Usuários

Registro de usuário

Login com JWT

Rota protegida

Níveis de acesso:

admin

user

🌦️ Weather (Clima)

Criar dados climáticos 

Listar dados climáticos

Filtrar por cidade

Buscar por ID

Atualizar dados 

Deletar dados (admin)

📁 Estrutura do Projeto
src/
 ├── auth/
 │    ├── auth.controller.ts
 │    ├── auth.service.ts
 │    ├── jwt.strategy.ts
 │    └── guards/
 │
 ├── users/
 │    ├── users.controller.ts
 │    └── users.service.ts
 │
 ├── weather/
 │    ├── weather.controller.ts
 │    ├── weather.service.ts
 │    ├── dto/
 │    └── schemas/
 │
 ├── app.module.ts
 └── main.ts

🗄️ Instalação
1️⃣ Clonar o repositório
git clone <seu-repositorio>
cd projeto-weather

2️⃣ Instalar dependências
npm install

3️⃣ Criar arquivo .env
MONGO_URI=mongodb://root:root@mongo:27017
JWT_SECRET=supersecretjwtkey
PORT=3000
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672/
RABBITMQ_QUEUE=weather_queue

▶️ Executar o projeto
Desenvolvimento
npm run start:dev

Produção
npm run build
npm run start:prod

🔥 Rotas da API
👤 Auth
Método	Rota	Descrição
POST	/auth/register	Cria um usuário
POST	/auth/login	Retorna JWT
👥 Users
Método	Rota	Descrição
GET	/users/me	Dados do usuário autenticado
🌦️ Weather
Método	Rota	Papel	Descrição
POST	/weather	
GET	/weather	user/admin	Lista todos
GET	/weather?city=São Paulo	user/admin	Filtra por cidade
GET	/weather/:id	user/admin	Busca por ID
PATCH	/weather/:id	admin	Atualiza
DELETE	/weather/:id	admin	Remove
🔑 Exemplo de Login

Resposta:

{
  "token": "jwt.aqui"
}


Envie o token no header:

Authorization: Bearer seu_token

🛡️ Controle de Acesso (RBAC)

user → pode apenas listar e buscar dados.

admin → pode criar, editar e excluir dados.

Feito via decorator personalizado como:

@Roles('admin')

🧪 Testes (opcional)
npm run test
