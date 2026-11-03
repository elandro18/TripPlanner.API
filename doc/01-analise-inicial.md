# 01 — Análise inicial do projeto

Levantamento feito em **2026-11-02**, antes de qualquer alteração, com o objetivo
de responder: *"consigo rodar esta API localmente com um banco local e testá-la
pelo Swagger, mantendo o Neon só em produção?"*

---

## 1. Stack e estrutura

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22.20.0 |
| Framework | NestJS 10 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) |
| Linguagem | TypeScript 5.9 (`strict: true`) |
| ORM | Prisma 7.10 (`prisma-client`, `moduleFormat: cjs`) |
| Driver | `@prisma/adapter-pg` + `pg` |
| Banco | PostgreSQL (`provider = "postgresql"`) |
| Auth | JWT próprio (`@nestjs/jwt`) + bcrypt |
| Docs | `@nestjs/swagger` 7 + `swagger-ui-express` |
| Testes | Jest 29 + `ts-jest` + `supertest` + PGlite (`@electric-sql/pglite`) |

Arquitetura em camadas: `Controller → Service → Repositório (porta + adapter
Prisma)`. O binding das portas fica centralizado em `PersistenciaModule`, o que
permite trocar o adapter nos testes por injeção de dependência.

**Módulos de domínio:** `usuarios`, `auth`, `viagens`, `destinos`, `locais`,
`passagens`, `hoteis`, `roteiro`, `listas`.

**Superfície da API:** 52 operações distribuídas em 29 rotas, sob o prefixo
`/api/v1`.

---

## 2. O que já estava bom

- Estrutura em camadas consistente, com portas de repositório bem definidas.
- Migrations versionadas (`prisma/migrations/20261030093217_init`).
- Testes isolados: cada arquivo de teste sobe um PGlite próprio e aplica as
  migrations reais — sem rede e sem banco compartilhado.
- Tratamento de erro padronizado: todo erro sai no envelope em **array** do
  `ERROR_CATALOG.md` (`[{ id, message, field, detail }]`).
- Paginação offset com validação (`page`/`size`) e isolamento por dono (RN-004)
  aplicado em todos os endpoints de domínio.
- Tipagem estrita e `tsc --noEmit` limpo.

---

## 3. Lacunas encontradas

### 3.1 Bloqueantes para rodar local

| # | Problema | Impacto |
|---|---|---|
| L-01 | **Não existia `.env`** no repositório | `PrismaService` lançava `DATABASE_URL é obrigatória` no boot — a API não subia |
| L-02 | Um único `DATABASE_URL` para todos os ambientes | Nada impedia o dev apontar para o Neon, gravando dados de teste em produção |
| L-03 | `load-env.ts` carregava apenas `.env` | Sem suporte a `.env.development` / `.env.local` |
| L-04 | `prisma.config.ts` e `seed.ts` usavam `dotenv/config` | O CLI e o seed podiam enxergar um banco diferente do que a aplicação usava |
| L-05 | `.gitignore` tinha `.env*` depois de `!.env.example` | A última regra vencia: qualquer novo `.env.*.example` nascia ignorado |
| L-06 | Sem script de provisionamento do banco local | Criar role, banco e senha era manual e não documentado |

### 3.2 Swagger existia, mas não servia para testar

| # | Problema | Impacto |
|---|---|---|
| S-01 | **Zero** `@ApiOperation` em 52 endpoints | A UI mostrava só `POST /viagens`, sem descrição do que o endpoint faz |
| S-02 | **Zero** `@ApiResponse` | Nenhum código de erro documentado, sem noção do que esperar |
| S-03 | DTOs sem `@ApiProperty` | Fora do plugin do Nest CLI (ex.: `ts-node`), o schema saía **vazio** (`properties: {}`) |
| S-04 | Nenhum `example` nos DTOs | O "Try it out" abria com `"string"`, `0`, datas inventadas |
| S-05 | Respostas são `interface` (não classe) | O Swagger infere os status, mas não o formato do corpo de retorno |
| S-06 | Sem `servers` no `DocumentBuilder` | Nenhuma distinção entre local e produção |
| S-07 | Swagger publicado em qualquer ambiente | Superfície exposta em produção sem controle |
| S-08 | Sem endpoint de saúde | Nenhuma forma rápida de saber se o banco está conectado |
| S-09 | `docs:export` não existia | Sem `openapi.json` para Postman/Insomnia |

> S-03 é o detalhe mais importante: com `nest start`/`nest build` o plugin do
> Swagger injeta os schemas, então o problema passava despercebido no dia a dia.
> Mas qualquer execução via `ts-node` gerava documentação vazia — e o
> `docs:export` é justamente uma delas.

### 3.3 Produção

| # | Problema | Impacto |
|---|---|---|
| P-01 | Nenhum guard que recuse banco local em produção | Risco de deploy apontando para `localhost` |
| P-02 | Sem `sslmode` documentado/validado | Neon exige TLS; a falha só apareceria em runtime |
| P-03 | Migrations de produção vs. pooler | DDL no pooler do Neon é problemático (advisory lock) — já havia preferência por `DATABASE_URL_UNPOOLED`, mas sem documentação |
| P-04 | Runtime incompatível com Vercel | `start:prod` é `node dist/main` (processo long-lived); Vercel espera handler serverless |
| P-05 | `JWT_SECRET` só era obrigatório em produção — correto, mas sem orientação de geração | Risco de segredo fraco/duplicado |

---

## 4. Ambiente da máquina no momento da análise

| Item | Valor |
|---|---|
| PostgreSQL local | **18** instalado, serviço `postgresql-x64-18` **em execução** na porta `5432` |
| Autenticação do Postgres | `scram-sha-256` (exige senha; sem `pgpass`) |
| Docker | Instalado (Rancher Desktop), **daemon parado** — não foi usado |
| `psql` | `C:\Program Files\PostgreSQL\18\bin\psql.exe` (fora do `PATH`) |
| Node / npm | 22.20.0 / 10.9.3 |

Decisão derivada: usar o PostgreSQL 18 já em execução, sem Docker e sem PGlite
persistente (ver [DEC-001](05-decisoes-e-pendencias.md#dec-001--postgresql-local-em-vez-de-docker-ou-pglite)).
