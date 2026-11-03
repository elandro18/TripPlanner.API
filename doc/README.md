# Documentação — TripPlanner.API

Registro de trabalho da API: análise do projeto, decisões, ambientes, operação e
histórico de alterações. Documentação de **trabalho** (como o time usa e mantém),
complementar ao `README.md` da raiz (visão de entrada do projeto).

Última atualização: **2026-11-02**

---

## Índice

| Documento | Para que serve |
|---|---|
| [01 — Análise inicial](01-analise-inicial.md) | Como o projeto estava antes desta rodada e quais lacunas existiam |
| [02 — Ambientes (local × produção)](02-ambientes.md) | Regras de `.env`, validação da `DATABASE_URL`, Neon e Vercel |
| [03 — Swagger e health check](03-swagger-e-health.md) | Como documentar e testar a API manualmente |
| [04 — Runbook local](04-runbook-local.md) | Passo a passo para subir do zero e resolver os erros comuns |
| [05 — Decisões e pendências](05-decisoes-e-pendencias.md) | Decisões tomadas (com justificativa) e backlog priorizado |
| [06 — Histórico de alterações](06-alteracoes.md) | O que mudou, arquivo por arquivo, e como foi validado |
| [07 — Deploy: Vercel + Neon](07-deploy-vercel-neon.md) | Passo a passo para publicar em produção |

---

## Resumo executivo

**Projeto:** backend do Trip Planner — NestJS 10, TypeScript, Prisma 7,
PostgreSQL.

**Objetivo da rodada:** permitir testar a aplicação localmente com um banco
local e usar o Neon apenas em produção, com o Swagger servindo de ferramenta de
teste manual.

**Estado:**

| Item | Situação |
|---|---|
| Separação local × produção | ✅ implementada (arquivos `.env` em camadas + validação no boot) |
| Proteção contra usar o banco errado | ✅ implementada (falha no boot com mensagem acionável) |
| Banco local provisionado | ✅ `tripplanner_dev` criado, migration aplicada e seed com o usuário demo |
| Swagger utilizável para testes | ✅ implementado (summaries, exemplos, servers, gate por ambiente) |
| `GET /api/v1/health` | ✅ implementado e coberto por teste e2e |
| Deploy na Vercel | ✅ handler serverless implementado e validado localmente · ⏳ falta criar o projeto e cadastrar as variáveis |

**Qualidade na data desta documentação:**

- `npm run typecheck` → sem erros
- `npm test` → **80 testes** (8 suítes)
- `npm run test:e2e` → **76 testes** (5 suítes)
- `npm run build` → `dist/` gerado
- `npm run docs:export` → 29 rotas / 52 operações no OpenAPI
- **Validação end-to-end no banco local:** `/health` 200 com `banco.status = ok`,
  login demo, `/auth/me`, `/viagens` e Swagger UI (HTTP 200)

> Os testes usam **PGlite** (PostgreSQL em WASM, em memória): não tocam o banco
> local nem o Neon, e não precisam de rede.
