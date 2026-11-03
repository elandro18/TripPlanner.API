# TripPlanner.API

Backend do **Trip Planner** — API REST (Node.js + NestJS, TypeScript) que serve
o frontend do planejador de viagem.

- Base URL dos contratos: `/api/v1`
- Persistência: **PostgreSQL + Prisma** (Postgres local em dev, Neon em produção)
- Autenticação: JWT próprio (e-mail/senha, bcrypt)
- Documentação de projeto (RDD): `C:\Users\ec64212\Desktop\Branch\Projeto1\TripPlanner`

> **Documentação de trabalho:** [`doc/`](doc/README.md) — análise do projeto,
> ambientes, Swagger/health, runbook local, decisões e histórico de alterações.

## Requisitos

- Node.js **20+** (recomendado 24; os testes usam PGlite, um Postgres em WASM)
- npm 10+
- **PostgreSQL 18 local** para rodar a API em desenvolvimento (o Neon é só produção)

---

## Desenvolvimento (banco local)

### 1. Instalar e configurar

```powershell
npm install
npm run db:setup:local
```

`db:setup:local` é idempotente e faz tudo:

1. pede a senha do superusuário `postgres` (só para criar role/banco);
2. cria/atualiza o role `tripplanner` com senha aleatória;
3. cria o banco `tripplanner_dev`;
4. grava `DATABASE_URL` no `.env` (a senha nunca aparece no terminal);
5. aplica as migrations e o seed.

> Se preferir fazer manualmente: copie `.env.example` para `.env`, crie o banco e
> rode `npm run db:migrate:local` + `npm run db:seed:local`.

### 2. Subir

```powershell
npm run env:check    # confere o ambiente sem imprimir senha
npm run start:dev    # http://localhost:3000/api/v1
```

**Login demo (após o seed):** `demo@tripplanner.local` / `demo1234`.

### 3. Testar pelo Swagger

Com a API rodando:

- UI: **http://localhost:3000/api/docs**
- OpenAPI JSON: **http://localhost:3000/api/docs-json**

Fluxo:

1. Abra `GET /api/v1/health` → **Try it out** → **Execute**. Deve responder `200`
   com `banco.status = "ok"` (confirma a conexão com o banco local).
2. `POST /api/v1/auth/login` com `demo@tripplanner.local` / `demo1234`.
3. Copie o `token` da resposta.
4. Clique em **Authorize**, cole o token (sem `Bearer `) e confirme.
5. Os endpoints protegidos passam a enviar o header automaticamente
   (`persistAuthorization` mantém o token entre recarregamentos).

### Como o ambiente é resolvido

| `NODE_ENV` | Arquivos carregados | Banco permitido |
|---|---|---|
| `development` (padrão) | `.env.local` → `.env.development` → `.env` | **só local** (Neon é bloqueado) |
| `test` | nenhum (usa PGlite) | — |
| `production` | **nenhum** (só variáveis do host) | **só remoto** (localhost é bloqueado) |

Regras de segurança aplicadas no boot (ver `src/config/banco-de-dados.ts`):

- `DATABASE_URL` ausente ou inválida → a API **não sobe**, com mensagem acionável.
- `NODE_ENV=production` + host local → **falha**.
- `development` + host remoto (Neon) → **falha**, salvo `ALLOW_REMOTE_DB=true`.
- A senha é sempre mascarada nos logs.

`ALLOW_REMOTE_DB=true` serve para testar o Neon de propósito a partir da máquina
local. Use com consciência: é o banco de produção.

### Scripts

| Script | Descrição |
|---|---|
| `npm run db:setup:local` | Cria role + banco local, grava o `.env`, migra e faz seed |
| `npm run db:migrate:local` | `prisma migrate dev` (cria migration nova) |
| `npm run db:seed:local` | Aplica o seed de desenvolvimento |
| `npm run db:reset:local` | Recria o banco local do zero (apaga dados) e reaplica o seed |
| `npm run env:check` | Diagnóstico do ambiente (arquivos `.env`, banco, Swagger) |
| `npm run docs:export` | Gera `openapi.json` para importar no Postman/Insomnia |
| `npm run start:dev` / `start` | Executa a API (`--watch` no dev) |
| `npm run build` | `prisma generate` + `migrate deploy` (quando há URL) + `nest build` |
| `npm run start:prod` | Executa o build (`node dist/main`) |
| `npm run db:deploy` | Aplica migrations em produção (`prisma migrate deploy`) |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm test` | Testes unitários/integração (Jest + PGlite) |
| `npm run test:e2e` | Testes HTTP (`supertest` + PGlite) |
| `npm run typecheck` | Checagem de tipos de `src/` e `test/` |

### Variáveis de ambiente

Descritas em `.env.example` (dev) e `.env.production.example` (prod):

| Variável | Padrão | Uso |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente (define arquivos `.env` e validações) |
| `PORT` | `3000` | Porta HTTP |
| `API_PREFIX` | `api/v1` | Prefixo global |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas (separadas por vírgula) |
| `DATABASE_URL` | (obrigatório) | Connection string do PostgreSQL (pooler no Neon) |
| `DATABASE_URL_UNPOOLED` | (opcional) | Conexão direta do Neon, usada por migrations no build |
| `PG_POOL_MAX` | `10` | Conexões simultâneas do pool `pg` (3–5 em serverless) |
| `ALLOW_REMOTE_DB` | `false` | Permite banco remoto em desenvolvimento |
| `SWAGGER_ENABLED` | `true` fora de prod | Liga/desliga `/api/docs` |
| `PUBLIC_API_URL` | — | URL publicada em `servers` no OpenAPI |
| `JWT_SECRET` | (dev) | Segredo do JWT — obrigatório em produção |
| `JWT_EXPIRES_IN` | `1h` | Validade do token |
| `BCRYPT_SALT_ROUNDS` | `10` | Custo do hash de senha |
| `ENV_FILE` | — | Força um único arquivo de env (CI) |

---

## Produção (Neon)

Em `NODE_ENV=production` **nenhum `.env` é lido**: tudo vem do painel do host.

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | connection string **pooled** do Neon (`...-pooler...?sslmode=require`) |
| `DATABASE_URL_UNPOOLED` | connection string **direta** do Neon (migrations/DDL) |
| `JWT_SECRET` | segredo forte (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CORS_ORIGINS` | domínio(s) do frontend |
| `SWAGGER_ENABLED` | `false` (padrão em produção) |
| `PUBLIC_API_URL` | URL pública da API (opcional, vai para o OpenAPI) |

O `npm run build` já aplica `prisma migrate deploy` usando a URL **direta**
(`DATABASE_URL_UNPOOLED`), que é o recomendado no Neon — DDL não passa pelo
pooler.

Validação pós-deploy: abra `GET https://sua-api/api/v1/health` (público, sem
Bearer). `banco.status = "ok"` significa que a API está falando com o Neon.

> **Vercel:** a API já inclui o handler serverless (`api/index.ts` +
> `vercel.json`). Passo a passo completo em
> [`doc/07-deploy-vercel-neon.md`](doc/07-deploy-vercel-neon.md).

---

## Estrutura

```
api/
└── index.ts           # entrypoint serverless da Vercel
prisma/
├── schema.prisma      # modelo de dados (PostgreSQL)
├── migrations/        # migrations versionadas
└── seed.ts            # dados de demonstração
scripts/
├── setup-local-db.ps1 # provisiona o Postgres local e grava o .env
├── check-env.ts       # diagnóstico do ambiente
├── export-openapi.ts  # gera openapi.json
└── migrate-deploy.js  # migrate deploy no build (prefere a URL direta)
src/
├── config/            # env em camadas, validação do banco, Swagger
├── common/            # erros de domínio, filtro HTTP, paginação, utils
├── persistencia/      # PrismaService + binding porta → repositório Prisma
└── modules/
    ├── health/        # GET /health (API + banco)
    ├── usuarios/      # TRIP_USUARIO
    ├── auth/          # registro, login, logout e sessão JWT
    ├── viagens/       # viagens, dias e resumo
    ├── destinos/      # múltiplos destinos por viagem
    ├── locais/        # locais/atrações
    ├── passagens/     # passagens (avião/trem/ônibus)
    ├── hoteis/        # hospedagens
    ├── roteiro/       # cards do Kanban (dia × item)
    └── listas/        # checklists e itens
```

Padrão em camadas `Controller → Service → Repositório (porta + adapter Prisma)`.
Os testes usam um **PostgreSQL em memória (PGlite) criado a partir das
migrations** — sem rede, sem banco compartilhado e sem tocar o banco local.

**Isolamento por dono (RN-004):** todos os endpoints de domínio exigem Bearer e
resolvem o dono pelo token; acesso a recurso de outro usuário → `403` (ERR-032),
exceto listas (404 para não revelar a existência).
**Paginação offset:** `page` (base 0) e `size` (padrão 20, máx. 100).

## Endpoints

### Saúde
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | API + conexão com o banco (200/503), público |

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/registrar` | Cadastro (201 com token) |
| `POST` | `/auth/login` | Login (200 com token) |
| `POST` | `/auth/logout` | Encerra a sessão (204) |
| `GET` | `/auth/me` | Usuário autenticado |

### Viagens, dias e resumo
| Método | Rota | Descrição |
|---|---|---|
| `GET`/`POST` | `/viagens` | Lista (offset) / cria viagem (201) |
| `GET`/`PUT`/`DELETE` | `/viagens/{id}` | Consulta / edita / exclui |
| `PUT` | `/viagens/{id}/ativa` | Troca a viagem ativa |
| `GET` | `/viagens/{id}/resumo` | Contagens, progresso e orçamento |
| `GET`/`POST` | `/viagens/{id}/dias` | Lista / cria dia manual |
| `GET`/`PUT`/`DELETE` | `/dias/{id}` | Consulta / edita / exclui dia |

Viagens podem ser criadas com ou sem datas (`comDatas: false`). Com datas, os
dias são gerados automaticamente a partir do período; sem datas, os dias são
criados manualmente (`data = null`).

### Destinos
| Método | Rota | Descrição |
|---|---|---|
| `GET`/`POST` | `/viagens/{id}/destinos` | Lista / cria destino |
| `PUT` | `/viagens/{id}/destinos/reordenar` | Reordena (`{ ids: [...] }`) |
| `GET`/`PUT`/`DELETE` | `/destinos/{id}` | Consulta / edita / exclui |

### Locais, passagens e hotéis
| Método | Rota | Descrição |
|---|---|---|
| `GET`/`POST` | `/viagens/{id}/locais` | Lista (offset) / cria local |
| `GET`/`PUT`/`DELETE` | `/locais/{id}` | Consulta / edita / exclui |
| `GET`/`POST` | `/viagens/{id}/passagens` | Lista (offset) / cria passagem |
| `GET`/`PUT`/`DELETE` | `/passagens/{id}` | Consulta / edita / exclui |
| `GET`/`POST` | `/viagens/{id}/hoteis` | Lista (offset) / cria hotel |
| `GET`/`PUT`/`DELETE` | `/hoteis/{id}` | Consulta / edita / exclui |

Locais e hotéis guardam `lat`/`lng`/`geoStatus` e `fotoUrl`. Passagens guardam
dados do bilhete (`numeroBilhete`, `passageiro`, `classe`, `terminal`,
`assento`, `moeda`, `documentoHash`, `importadoDe`) e aceitam `tipo` em
minúsculas (normalizado para maiúsculas). Valores monetários são opcionais
(`valor`, `valorTotal`).

### Roteiro (Kanban)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/viagens/{id}/roteiro` | Cards da viagem (dia + item) |
| `POST` | `/dias/{id}/roteiro` | Vincula item ao dia (201) |
| `PUT` | `/roteiro/{id}` | Move, reordena, altera horário ou conclui |
| `PUT` | `/dias/{id}/roteiro/reordenar` | Reordenação em lote |
| `DELETE` | `/roteiro/{id}` | Remove o card (não o item) |

Ao vincular um item, o horário é sugerido a partir do registro (local:
`horarioPrevisto`/`duracaoEstimada`; passagem: partida/chegada). Sobreposição no
mesmo dia → `422` (ERR-050); item duplicado no dia → `409` (ERR-042).

### Listas/checklists
| Método | Rota | Descrição |
|---|---|---|
| `GET`/`POST` | `/listas` | Lista do usuário / cria lista |
| `GET`/`PUT`/`DELETE` | `/listas/{id}` | Consulta / edita / exclui |
| `GET`/`POST` | `/listas/{id}/itens` | Lista / cria item |
| `PUT` | `/listas/{id}/itens/reordenar` | Reordena itens |
| `PUT`/`DELETE` | `/itens/{id}` | Edita (inclui concluir) / exclui |

Itens concluídos vão para o fim da lista, ordenados pela data de conclusão.
Valores previsto/pago e fotos são suportados.

## Erros

Envelope em **array** do `ERROR_CATALOG.md`:
`[{ "id": "ERR-040", "message": "E-mail já cadastrado", "field": "email", "detail": null }]`.

## Fora do backend

Geocodificação (OSM/Photon/Nominatim) e importação de passagem por PDF/OCR
continuam no frontend — o backend apenas persiste as coordenadas e os dados
extraídos.
