#!/usr/bin/env bash
set -euo pipefail

# Valores alinhados a docker-compose.yml e .env do repositório
MYSQL_CONTAINER="erp_mysql"
MYSQL_USER="root"
MYSQL_PASSWORD="root"
DB_NAME="erp_db"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/3] Derrubando e recriando o banco MySQL '${DB_NAME}' no container '${MYSQL_CONTAINER}'..."
docker exec -i "${MYSQL_CONTAINER}" mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e \
  "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "[2/3] Compilando o projeto (gera dist/ incluindo migrations)..."
npm run build

echo "[3/3] Executando migrations (npx typeorm migration:run)..."
npx typeorm migration:run -d dist/database/dataSourceCLI.js

echo "Concluído: banco '${DB_NAME}' recriado e migrations aplicadas."
