# ================================
#  Etapa base do Python
# ================================
FROM python:3.11-slim

# Define diretório de trabalho
WORKDIR /app

# Impede geração de .pyc e ativa flush imediato do output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements (caso exista)
COPY requirements.txt .

# Instala dependências do PIP
RUN pip install --no-cache-dir -r requirements.txt || true

# Copia todo projeto
COPY . .

# Define timezone para evitar warnings
ENV TZ=UTC

# Comando padrão do container
CMD ["python", "-u", "/app/producer.py"]
