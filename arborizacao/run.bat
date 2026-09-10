@echo off
setlocal
cd /d "%~dp0"

rem ============================================================
rem  Arborizacao - subida local / rede interna
rem ============================================================
rem  Banco padrão: SQLite (arquivo arborizacao.db na raiz do projeto)
rem  Para usar MySQL, defina as variáveis em config\run-local.bat:
rem     set "DB_URL=jdbc:mysql://localhost:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
rem     set "DB_USERNAME=root"
rem     set "DB_PASSWORD=SUA_SENHA"
rem     set "DB_DRIVER=com.mysql.cj.jdbc.Driver"
rem     set "DB_PLATFORM=org.hibernate.dialect.MySQLDialect"
rem ============================================================

if exist "config\run-local.bat" call "config\run-local.bat"

if not defined DB_URL set "DB_URL=jdbc:sqlite:arborizacao.db"
if not defined DB_DRIVER set "DB_DRIVER=org.sqlite.JDBC"
if not defined DB_PLATFORM set "DB_PLATFORM=org.hibernate.community.dialect.SQLiteDialect"
if not defined DB_USERNAME set "DB_USERNAME="
if not defined DB_PASSWORD set "DB_PASSWORD="
if not defined SERVER_PORT set "SERVER_PORT=8080"

echo Iniciando arborizacao na porta %SERVER_PORT%...
java -jar "target\arborizacao-0.0.1-SNAPSHOT.jar"