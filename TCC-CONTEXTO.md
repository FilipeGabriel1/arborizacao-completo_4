# Contexto do Projeto — Sistema de Arborização Urbana (para TCC)

> **Como usar:** cole este arquivo inteiro como primeira mensagem no ChatGPT (ou anexe).
> Depois faça suas perguntas. No fim, se precisar, anexe também os `SESSION_*.md`
> (diários de sessão do desenvolvimento) para detalhes técnicos.

---

## 1. Visão geral

Sistema web **Sistema de Gestão da Arborização Urbana** da **AMASVISA — Prefeitura de
Vitória de Santo Antão (PE)**, desenvolvido como **TCC**. Mapeia áreas verdes arborizadas
e o inventário de árvores da cidade, com acesso público (consulta) e área técnica
(cadastro/gestão para funcionários).

**Módulos:**
- **Público (sem login):** mapa interativo com áreas e árvores (MapLibre + OpenStreetMap),
  listagem de áreas com fotos, detalhe da área (descrição, bairro, galeria), espécies,
  histórico de alterações público, indicadores, sementeira, doações de mudas.
- **Área técnica (com login):** painel com KPIs e gráficos (donut), cadastro/edição de
  áreas (com desenho de polígono no mapa e importação KML), inventário arbóreo (cadastro
  completo por abas: identificação, localização, dendrométrica, fitossanitária), espécies,
  sementeira (lotes de mudas), plantios, doações de árvores (com CPF/RG cifrado),
  ordens de serviço/manejo, relatórios (PDF/XLSX), usuários e histórico de auditoria.
- **Perfis:** ADMIN, FUNCIONARIO, ORDENS (perfil restrito que só vê Ordens de Serviço).

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 21/22, Spring Boot 4.1.0 (Spring Security, JPA/Hibernate) |
| Banco | TiDB Cloud (MySQL-compatible) + colunas binárias para fotos |
| Cripto | AES-GCM (`EncryptService`) para CPF/RG de doadores; BCrypt para senhas |
| Front | HTML/CSS/JS vanilla (sem framework), MapLibre GL 5.6.1, tiles OSM |
| Segurança | Sessão por cookie, CSRF (cookie `XSRF-TOKEN` + header), CSP, HSTS, rate limit de login, perfis validados no servidor |
| HTTPS | mkcert local (`config/arborizacao.p12`), app em `https://localhost:8443`, 8080→307 |
| Testes | JUnit (`mvnw test`), scripts Node `.cjs` de verificação E2E |

## 3. Arquitetura (resumo)

- Páginas estáticas em `src/main/resources/static/arborizacao/` + APIs REST `/api/**`.
- `SecurityConfig.java`: lista `permitAll` explícita (páginas públicas + GETs de
  consulta: areas, arvores, especies, placar, sementeira, kml export); qualquer escrita
  (POST/PUT/PATCH/DELETE) exige FUNCIONARIO/ADMIN; `/api/**` sem sessão → 401 (JSON),
  HTML sem sessão → 302 login; doações bloqueadas para ORDENS (dados de cidadãos).
- Front `auth.js` intercepta 401 (exceto `/api/auth/me`) e manda pro login;
  `csrf.js` injeta token em todo fetch/formulário de escrita.
- Fotos salvas no banco e servidas via endpoint de imagem.

## 4. Decisões relevantes (úteis para o TCC)

- **Escolha do servidor:** para lançamento público, decidido **servidor pago gerenciado
  (Azure App Service, plano B1 ~R$75/mês)**; domínio `.com.br` a comprar (~R$40/ano,
  exige CNPJ); conta Azure criada pelo aluno.
- **Sem framework de front** (vanilla JS): controle total, leve, sem build step.
- **Mapa OpenStreetMap + MapLibre** (grátis, sem chave de API).
- **Perfil ORDENS** criado para equipe de campo: usa o sistema sem ver dados sensíveis.
- **Dados:** demonstração real de cidades/áreas (ex.: Praça Dom Luiz de Brito, cadastrada
  via fluxo real de cadastro) + dados de teste a serem limpos antes do lançamento.

## 5. Segurança (bloco forte do trabalho — pode virar capítulo)

Recomendações de auditoria aplicadas (itens 15-20 de 20):
1. **HTTPS** com mkcert (HSTS habilitado; cookies `Secure`).
2. **CSP** estrita (somente origens reais usadas; scan de 21 páginas sem violações).
3. **CSRF** em todas as escritas (padrão Spring com cookie não-HttpOnly + header crua).
4. **Rate limit de login** (IP+e-mail, 429) + trava de tentativas.
5. **Perfil ORDENS** validado no **servidor** (não só escondendo botões no front).
6. **Rotação de credenciais:** senha do TiDB e `ENCRYPTION_KEY` rotacionadas; CPF/RG já
   cifrados re-cifrados com ferramenta transacional (`ReencryptTool`); verificação de
   decifragem nas 2 máquinas de teste.
7. Auditoria/entradas: histórico de alterações, dados de doadores cifrados (AES-GCM),
   senhas BCrypt, sem senha/chave em repositório.

## 6. Estado atual (2026-10-07)

- **Funcionando:** todas as telas públicas e técnicas; testes E2E passando
  (`security-test.cjs` 21/21, `mvnw test` exit 0, scan CSP sem violações).
- **Mobile:** auditoria 390×844 feita (sem overflow); bug do mapa com largura 0 em
  `arvores.html` corrigido (grid inline → media queries).
- **Pendências antes de ir público:** trocar senhas padrão, limpar dados de teste,
  allowlist de IP + backup no TiDB, arquivos de deploy (jar + GitHub Actions + DEPLOY.md),
  renomear "Área do funcionário" nas telas públicas.
- **Diários de sessão:** `SESSION_2026-09-21.md` … `SESSION_2026-10-07.md` (passo a passo
  de tudo que foi feito — ótima fonte para a seção "metodologia/desenvolvimento" do TCC).

## 7. Sugestão do que pedir ao ChatGPT

- Estrutura do TCC (capítulos: introdução, revisão, requisitos, arquitetura,
  implementação, testes/segurança, conclusão) usando este contexto.
- Redigir capítulos a partir dos `SESSION_*.md`.
- Diagramas (Mermaid) de arquitetura, diagrama de classes/dados do modelo de domínio.
- Relato de decisões técnicas com justificativa (por que vanilla, por que OSM, por que
  perfil restrito etc.).
- Preparação de defesa/presentação.
