#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# ============================================================
#  Arborizacao - subida local / rede interna
# ============================================================
#  Banco padrão: SQLite (arquivo arborizacao.db na raiz do projeto)
#  Para usar MySQL, defina as variáveis em config/run-local.sh:
#     export DB_URL='jdbc:mysql://localhost:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
#     export DB_USERNAME='root'
#     export DB_PASSWORD='SUA_SENHA'
#     export DB_DRIVER='com.mysql.cj.jdbc.Driver'
#     export DB_PLATFORM='org.hibernate.dialect.MySQLDialect'
# ============================================================

if [ -f "config/run-local.sh" ]; then
  # shellcheck disable=SC1091
  . "config/run-local.sh"
fi

export DB_URL="${DB_URL:-jdbc:sqlite:arborizacao.db}"
export DB_DRIVER="${DB_DRIVER:-org.sqlite.JDBC}"
export DB_PLATFORM="${DB_PLATFORM:-org.hibernate.community.dialect.SQLiteDialect}"
export DB_USERNAME="${DB_USERNAME:-}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export SERVER_PORT="${SERVER_PORT:-8080}"

echo "Iniciando arborizacao na porta $SERVER_PORT..."
exec java -jar "target/arborizacao-0.0.1-SNAPSHOT.jar"