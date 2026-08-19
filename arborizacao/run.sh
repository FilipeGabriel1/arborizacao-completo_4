#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# ============================================================
#  Arborizacao - subida local / rede interna
# ============================================================
#  Para personalizar o banco sem editar este arquivo, crie
#  config/run-local.sh (gitignored) com algo como:
#     export DB_URL='jdbc:mysql://192.168.0.10:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
#     export DB_USERNAME='root'
#     export DB_PASSWORD='SUA_SENHA'
# ============================================================

if [ -f "config/run-local.sh" ]; then
  # shellcheck disable=SC1091
  . "config/run-local.sh"
fi

export DB_URL="${DB_URL:-jdbc:mysql://localhost:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}"
export DB_USERNAME="${DB_USERNAME:-root}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export SERVER_PORT="${SERVER_PORT:-8080}"

echo "Iniciando arborizacao na porta $SERVER_PORT..."
exec java -jar "target/arborizacao-0.0.1-SNAPSHOT.jar"