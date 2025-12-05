# Etapa 1 — Build
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# Etapa 2 — Servindo com Nginx
FROM nginx:alpine

# Remove config default
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia o arquivo de configuração customizado
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia build final (dist/) para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
