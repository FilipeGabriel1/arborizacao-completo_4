@echo off
setlocal
cd /d "%~dp0"

rem ============================================================
rem  Arborizacao - subida local / rede interna
rem ============================================================
rem  Para personalizar o banco sem editar este arquivo, crie
rem  config\run-local.bat (gitignored) com algo como:
rem     set "DB_URL=jdbc:mysql://192.168.0.10:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
rem     set "DB_USERNAME=root"
rem     set "DB_PASSWORD=SUA_SENHA"
rem ============================================================

if exist "config\run-local.bat" call "config\run-local.bat"

if not defined DB_URL set "DB_URL=jdbc:mysql://localhost:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
if not defined DB_USERNAME set "DB_USERNAME=root"
if not defined DB_PASSWORD set "DB_PASSWORD="
if not defined SERVER_PORT set "SERVER_PORT=8080"

echo Iniciando arborizacao na porta %SERVER_PORT%...
java -jar "target\arborizacao-0.0.1-SNAPSHOT.jar"