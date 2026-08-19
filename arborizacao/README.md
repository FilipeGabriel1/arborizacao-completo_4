# Arborização Urbana — Amasvisa

Sistema interno para cadastro e consulta das áreas arborizadas e árvores da
cidade, com mapa no OpenStreetMap (MapLibre), fotos (incluindo links do Google
Drive), login de funcionários, usuários com perfis (FUNCIONARIO/ADMIN) e
auditoria de todas as operações.

## Tecnologias

- Java 21 + Spring Boot 4.1
- Spring Data JPA + MySQL 8
- Spring Security (login por formulário, sessão, CSRF)
- Front-end estático (HTML/CSS/JS) + MapLibre GL
- Maven

## Pré-requisitos

- JDK 21
- Maven 3.9+
- MySQL 8 rodando localmente (ou remoto, via env vars)

## Configuração do banco

O MySQL deve ter um banco chamado `arborizacao`. As tabelas são criadas
automaticamente pelo JPA (`ddl-auto=update`). Opcionalmente, execute o script
`src/main/resources/CREATE DATABASE arborizacao;.sql`.

As credenciais **não ficam mais no repositório**. Escolha uma das opções:

1. **Local (recomendado para dev):** crie o arquivo `config/application-local.properties`
   (pasta `config/` é ignorada pelo git) com:

   ```properties
   spring.datasource.username=root
   spring.datasource.password=SUA_SENHA
   ```

2. **Variáveis de ambiente** (produção):

   ```bash
   DB_URL=jdbc:mysql://localhost:3306/arborizacao?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   DB_USERNAME=root
   DB_PASSWORD=SUA_SENHA
   ```

   Para ver o SQL executado em dev, use `SPRING_JPA_SHOW_SQL=true`.

## Executando

```bash
mvn spring-boot:run
```

ou, após o build:

```bash
mvn package
java -jar target/arborizacao-0.0.1-SNAPSHOT.jar
```

Acesse <http://localhost:8080/arborizacao/entrar.html>.

## Primeiro acesso

Na primeira execução (tabela `usuarios` vazia), o sistema cria um
administrador padrão:

- **E-mail:** `admin@amasvisa.com.br`
- **Senha:** `TrocarSenha123`

**Troque essa senha imediatamente** pela tela Usuários (Editar → nova senha).

## Segurança

- **CSRF habilitado:** o token é entregue em um cookie `XSRF-TOKEN` (via
  `GET /api/csrf`) e enviado como header `X-XSRF-TOKEN` pelo script
  `src/main/resources/static/arborizacao/csrf.js`. Formulários (login/logout)
  recebem o campo oculto `_csrf` automaticamente.
- **Área pública:** apenas leitura (GET) das áreas, árvores, espécies e locais.
- **Área interna:** escrita exige login; doações (dados de cidadãos) e usuários
  ficam restritas ao login.
- **Senhas:** armazenadas com BCrypt.

## Estrutura

```
src/main/java/br/com/amasvisa/arborizacao/
  area/        áreas arborizadas (mapa, polígono, fotos, Place Details OSM)
  arvore/      árvores e espécies
  doacao/      doações de mudas
  usuario/     usuários, perfis e login
  auditoria/   histórico de operações
  config/      segurança, seed do admin e CSRF

src/main/resources/static/arborizacao/
  index.html          mapa público (sem login)
  cadastro-areas.html áreas (interno)
  arvores.html        árvores
  especies.html       espécies
  doacoes.html        doações
  usuarios.html       usuários (ADMIN)
  historico.html      auditoria (ADMIN)
  login.html          login
  csrf.js             token CSRF para o front estático
```

## Testes

```bash
mvn test
```

Os testes usam H2 em modo MySQL (`src/test/resources/application.properties`).