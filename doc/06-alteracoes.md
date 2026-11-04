# 06 — Histórico de alterações

Registro da rodada de **2026-11-02**: separação local × produção, Swagger
utilizável e health check.

---

## 1. Resumo

| Área | Alteração |
|---|---|
| Ambiente | `.env` em camadas, validação da `DATABASE_URL` no boot, logs de ambiente |
| Prisma | CLI e seed usando o mesmo loader da aplicação; migrations pela conexão direta |
| Banco local | Script idempotente de provisionamento (`db:setup:local`) |
| Swagger | Summaries, exemplos nos DTOs, `servers`, gate por ambiente, export do OpenAPI |
| Saúde | `GET /api/v1/health` com ping no banco |
| Deploy | Handler serverless (`api/index.ts`), `vercel.json` e limite de pool `PG_POOL_MAX` |
| Docs | `README` reescrito + pasta `doc/` |

**Nenhuma mudança de contrato da API.** Rotas, payloads e códigos de erro
continuam iguais.

---

## 2. Arquivos novos

| Arquivo | Função |
|---|---|
| `src/config/banco-de-dados.ts` | Validação da `DATABASE_URL`, detecção local/Neon, mascaramento de senha |
| `src/config/banco-de-dados.spec.ts` | 13 testes das regras de validação |
| `src/modules/health/health.controller.ts` | `GET /health` com `SELECT 1` e 503 em falha |
| `src/modules/health/health.model.ts` | Contrato `HealthResponse` |
| `src/modules/health/health.module.ts` | Módulo (importa `PrismaModule`) |
| `test/health.e2e-spec.ts` | e2e dos caminhos 200 e 503 |
| `scripts/setup-local-db.ps1` | Provisiona role + banco, grava `.env`, migra e faz seed |
| `scripts/check-env.ts` | Diagnóstico do ambiente (`npm run env:check`) |
| `scripts/export-openapi.ts` | Gera `openapi.json` (`npm run docs:export`) |
| `.env.production.example` | Template das variáveis de produção (Neon) |
| `api/index.ts` | Entrypoint serverless da Vercel (Nest + `ExpressAdapter`, app em cache por instância) |
| `vercel.json` | Rewrite de todas as rotas para a função `/api` |
| `tsconfig.api.json` | Typecheck isolado do handler (`npm run typecheck:api`) |
| `src/common/utils/url-vercel.ts` | Restaura o caminho mascarado pelo rewrite da Vercel (+ spec) |
| `doc/*.md` | Esta documentação |

---

## 3. Arquivos modificados

### Configuração e bootstrap

| Arquivo | O que mudou |
|---|---|
| `src/config/load-env.ts` | Reescrito: resolução de ambiente, ordem de precedência, `ENV_FILE`, retorno com arquivos carregados/ausentes |
| `src/config/app-config.ts` | Novos campos `banco`, `swaggerEnabled`, `publicApiUrl`; validação da URL; helper `booleano()` com erro em valor inválido |
| `src/main.ts` | Log do ambiente e dos arquivos `.env` carregados; log do banco (mascarado) e do Swagger |
| `src/app.setup.ts` | Swagger condicionado a `config.swaggerEnabled` |
| `src/config/swagger.setup.ts` | `criarDocumentoOpenApi()` separado; `servers`; descrição com passo a passo; `customSiteTitle`; filtro e duração na UI |
| `src/persistencia/prisma/prisma.service.ts` | Usa `mascararUrl()`; mensagem de erro aponta o setup local |
| `src/app.module.ts` | Registra `HealthModule` |
| `prisma.config.ts` | Usa `carregarEnv()`; `datasource.url` prefere `DATABASE_URL_UNPOOLED` |
| `prisma/seed.ts` | Usa `carregarEnv()` em vez de `dotenv/config` |
| `package.json` | Novos scripts: `db:setup:local`, `db:migrate:local`, `db:seed:local`, `db:reset:local`, `env:check`, `docs:export`, `prestart:dev` |
| `.env.example` | Reescrito para o cenário local (Postgres), com `ALLOW_REMOTE_DB`, `SWAGGER_ENABLED`, `PUBLIC_API_URL` |
| `.gitignore` | Corrigida a ordem das regras (`!.env.*.example` antes de `.env*`); `openapi.json` ignorado |
| `README.md` | Reescrito: setup local, Swagger, tabela de ambientes, produção/Neon e estrutura |

### Controllers (52 operações)

Todos receberam `@ApiOperation({ summary })` e a importação de `ApiOperation`:

`auth`, `viagens`, `dias`, `destinos`, `locais`, `passagens`, `hoteis`,
`roteiro`, `listas`.

### DTOs (schemas do Swagger)

Todos receberam `@ApiProperty`/`@ApiPropertyOptional` com descrição, restrições e
exemplo:

`auth/dto/login.dto.ts`, `auth/dto/registrar.dto.ts`,
`viagens/dto/viagem.dto.ts`, `viagens/dto/dia.dto.ts`,
`destinos/dto/destino.dto.ts`, `locais/dto/local.dto.ts`,
`passagens/dto/passagem.dto.ts`, `hoteis/dto/hotel.dto.ts`,
`roteiro/dto/roteiro.dto.ts`, `listas/dto/lista.dto.ts`,
`common/dto/paginacao.dto.ts`.

### Testes de suporte

| Arquivo | Mudança |
|---|---|
| `test/support/config-de-teste.ts` | Inclui os novos campos de `AppConfig` (`banco: null`, `swaggerEnabled: false`, `publicApiUrl: null`) |

---

## 4. Validação executada

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erros |
| `npm test` | ✅ **80 testes** / 8 suítes |
| `npm run test:e2e` | ✅ **76 testes** / 5 suítes |
| `npm run build` | ✅ `dist/` gerado (`dist/main.js`, health incluído) |
| `npm run docs:export` | ✅ 29 rotas / 52 operações |
| `npm run env:check` (sem `.env`) | ✅ falha com mensagem acionável |
| `env:check` com URL local | ✅ ambiente OK, banco local detectado |
| `NODE_ENV=production` + URL local | ✅ bloqueado: "host local" |
| `development` + URL Neon | ✅ bloqueado: "Neon (produção)" |
| Sintaxe do `setup-local-db.ps1` | ✅ parser do PowerShell sem erros |
| `.env` gerado | ✅ UTF-8 sem BOM, lido corretamente por `process.loadEnvFile` |

**Não validado nesta rodada:** a criação do banco local de fato, porque o script
pede a senha do superusuário `postgres` e isso precisa ser feito no terminal do
operador (`npm run db:setup:local`).

---

## 5. Correções após o primeiro teste real

A primeira execução do `db:setup:local` em ambiente real expôs dois problemas que
os testes automatizados não pegavam — ambos no passo de migrations/seed:

| # | Sintoma | Causa | Correção |
|---|---|---|---|
| C-01 | `npm error could not determine executable to run` | `npx` falha quando invocado de dentro de um PowerShell aninhado (o script é chamado por outro PowerShell via `npm run`) | `setup-local-db.ps1` passou a chamar o CLI direto: `node node_modules/prisma/build/index.js` |
| C-02 | `'ts-node' não é reconhecido como comando` | o Prisma spawna `ts-node` num processo cujo `PATH` não inclui `node_modules/.bin` (o npm injeta isso nos scripts; a invocação direta não) | `prisma.config.ts` passou a usar `node -r ts-node/register/transpile-only prisma/seed.ts`; o script também injeta `node_modules/.bin` no `PATH` |
| C-03 | `[{"id":"ERR-000","message":"Cannot GET /"}]` em produção | `rewrites` da Vercel para uma **função** mascaram o caminho | `vercel.json` passou a enviar `?caminhoOriginal=$1`; `normalizarUrlDeFuncao()` restaura a URL |
| C-04 | `SwaggerUIBundle is not defined` em produção | os assets estáticos do `swagger-ui-dist` não entram no bundle serverless (só o `init.js`, gerado em memória) | `functions.includeFiles` no `vercel.json` + fallback `302` para o CDN |
| C-05 | "Try it out" do Swagger em produção chamando `localhost:3000` | a primeira entrada de `servers` era o host local | `servers: [{ "url": "/" }]` (mesma origem da página) |

Estado após as correções, validado ao vivo:

- banco `tripplanner_dev` com **12 tabelas** e 1 migration aplicada;
- seed aplicado (usuário `demo@tripplanner.local`, 1 viagem);
- `GET /api/v1/health` → **200**, `banco.status = "ok"`, latência ~75 ms na primeira consulta;
- login demo → 200 com token; `/auth/me` e `/viagens` com Bearer → 200;
- Swagger UI → HTTP 200; `/api/docs-json` → 29 rotas;
- `migrate deploy` e `db seed` com **exit code 0** (o "Exited with code 1" que
  aparece no terminal é só o PowerShell tratando o stderr do Prisma como erro de
  comando nativo — não é falha).

---

## 6. Deploy serverless (Vercel + Neon)

Implementado nesta rodada — antes existia apenas `node dist/main`, incompatível
com o modelo de funções da Vercel.

| Arquivo | Papel |
|---|---|
| `api/index.ts` | Cria a aplicação Nest com `ExpressAdapter` uma vez por instância e reaproveita entre invocações (inclui o pool do Prisma) |
| `vercel.json` | Redireciona `/` → `/api/docs`, reescreve rotas para `/api?caminhoOriginal=$1` e força `includeFiles` do `swagger-ui-dist` |
| `src/config/swagger.setup.ts` | Fallback 302 para o CDN quando os assets do Swagger UI não existem no bundle |
| `src/common/utils/url-vercel.ts` | Restaura o caminho original a partir de `?caminhoOriginal=` antes de chamar o Express |
| `tsconfig.api.json` | Typecheck do handler fora do build do Nest (para não mudar o `dist/`) |
| `src/persistencia/prisma/prisma.service.ts` | `PG_POOL_MAX` no `PrismaPg` (3–5 em serverless) |
| `src/config/banco-de-dados.ts` | `limiteDoPool()` com validação |

Validação local do handler (mesmo caminho de código que a Vercel executa,
montando um HTTP server que delega para `api/index.ts`):

```text
GET  /api/v1/health           -> 200 status=ok banco=ok
GET  /api/docs                -> 200 (HTML do Swagger)
GET  /api/docs-json           -> 200 titulo=TripPlanner.API
POST /api/v1/auth/login       -> 200 usuario=Ana Beatriz Moraes
GET  /api/v1/viagens?page&size -> 200 page=0 size=5 total=1
GET  /api/v1/viagens (sem)    -> 401
GET  /                        -> 404 (sem rota; a Vercel redireciona para /api/docs)
```

> O teste acima simula o rewrite da Vercel: cada requisição chega ao handler
> como `/api?caminhoOriginal=<caminho>` — exatamente o que acontece em produção.

Conferência adicional: o client gerado pelo Prisma 7 (`src/generated/prisma`)
tem **apenas arquivos `.ts`** — nenhum binário nativo, o que elimina a
complexidade de empacotar engine no serverless.

O passo a passo do deploy (Neon → Vercel → validação) está em
[07 — Deploy](07-deploy-vercel-neon.md).

---

## 7. Impacto e compatibilidade

- **Contrato da API:** inalterado. Nenhum DTO de entrada mudou de forma
  (validações preservadas), nenhuma rota foi adicionada/removida — exceto o novo
  `GET /api/v1/health`.
- **Assinatura interna:** `configurarSwagger(app)` passou a ser
  `configurarSwagger(app, config)`. Uso interno apenas.
- **`AppConfig`:** ganhou campos. Qualquer código externo que construa o objeto
  manualmente precisa preenchê-los (o helper de teste foi atualizado).
- **`.gitignore`:** arquivos `.env.*.example` passam a ser versionados — era a
  intenção original da regra.
- **`package-lock.json`:** já estava modificado antes desta rodada (não faz parte
  deste conjunto de mudanças); nenhuma dependência foi adicionada ou removida.

---

## 8. Ordem sugerida de revisão

1. `src/config/banco-de-dados.ts` + `src/config/banco-de-dados.spec.ts`
   (regra de negócio de ambiente, coberta por teste).
2. `src/config/load-env.ts` e `src/main.ts` (como o ambiente é resolvido).
3. `scripts/setup-local-db.ps1` (provisionamento).
4. `src/config/swagger.setup.ts` e um DTO qualquer (padrão de documentação).
5. `src/modules/health/*` e `test/health.e2e-spec.ts`.
6. `README.md` e `doc/`.
