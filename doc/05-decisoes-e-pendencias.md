# 05 — Decisões e pendências

Registro das decisões técnicas desta rodada (com o porquê) e do backlog que
sobrou.

---

## Decisões

### DEC-001 — PostgreSQL local em vez de Docker ou PGlite

**Contexto:** era preciso um banco local para desenvolvimento.

**Decisão:** usar o PostgreSQL 18 já instalado e em execução na porta 5432.

**Alternativas descartadas:**

| Alternativa | Por que não |
|---|---|
| Docker Compose | o daemon do Rancher Desktop estava parado; exigiria subir mais uma peça e escolher outra porta (5433) para não conflitar |
| PGlite persistente em arquivo | o Prisma CLI (`migrate`, `studio`) não opera bem sobre ele; serve para teste, não para desenvolvimento |

**Consequência:** o setup depende de uma instalação local do PostgreSQL. O
script verifica isso e falha com mensagem clara se o `psql` não for encontrado.

---

### DEC-002 — `.env` em camadas, e nada em produção

**Contexto:** um único `.env` para todos os ambientes não distingue dev de prod.

**Decisão:** carregar `.env.local` → `.env.<NODE_ENV>` → `.env` (o primeiro
vence, porque `process.loadEnvFile` não sobrescreve). Em `production`, **não
carregar arquivo nenhum** — as variáveis vêm do host.

**Por quê:** um `.env` esquecido no deploy jamais sobrescreve a conexão de
produção. O comportamento é determinístico e não depende de "lembrar de não
commitar".

**Escape hatch:** `ENV_FILE=<caminho>` força um único arquivo (CI).

---

### DEC-003 — Falhar no boot em vez de avisar

**Contexto:** apontar dev para o Neon pode inserir dados de teste em produção.

**Decisão:** a validação da `DATABASE_URL` **derruba a aplicação** quando o
ambiente e o host não combinam (produção + local, desenvolvimento + remoto).

**Alternativa descartada:** apenas emitir `warning` no log — fácil de ignorar.

**Consequência:** quem realmente precisa conectar num banco remoto em dev
precisa declarar `ALLOW_REMOTE_DB=true` explicitamente.

---

### DEC-004 — Role dedicada com `CREATEDB`

**Decisão:** a aplicação usa o role `tripplanner` (não o `postgres`), com
`LOGIN CREATEDB` e senha aleatória gravada apenas no `.env`.

**Por quê:**

- a senha do superusuário nunca vai para o disco;
- princípio do menor privilégio;
- `CREATEDB` é necessário para o *shadow database* do `prisma migrate dev`.

---

### DEC-005 — Swagger explícito em vez de depender do plugin do CLI

**Contexto:** `nest-cli.json` já habilita o plugin `@nestjs/swagger` com
`classValidatorShim` e `introspectComments`.

**Problema:** o plugin só roda sob o Nest CLI. Execuções via `ts-node` (como o
`npm run docs:export`) geravam `"properties": {}` — corpo de requisição vazio.

**Decisão:** declarar `@ApiProperty`/`@ApiPropertyOptional` nos DTOs, com
exemplos.

**Trade-off:** mais linhas nos DTOs, mas o schema fica idêntico em qualquer
contexto de execução e serve como documentação próxima ao campo.

---

### DEC-006 — Swagger desligado em produção por padrão

**Decisão:** `SWAGGER_ENABLED` tem default `true` fora de produção e `false` em
produção. Ligar exige ação explícita.

**Por quê:** documentação pública expõe a superfície inteira da API.

**Como testar produção então:** use o `openapi.json` (`npm run docs:export`)
importado no Postman/Insomnia, ou ligue a flag temporariamente.

---

### DEC-007 — `/health` público, com 503 quando o banco cai

**Decisão:** `GET /api/v1/health` não exige Bearer e retorna `503` quando o
`SELECT 1` falha.

**Por quê:** monitoramento não carrega token; `503` é o código que os
orquestradores entendem como "instância não está pronta".

**Cuidado tomado:** a resposta expõe `host:porta/banco`, nunca usuário ou senha.

---

### DEC-008 — Semântica de `PUT` mantida

**Contexto:** os DTOs de atualização herdam de criação (`AtualizarViagemDto
extends CriarViagemDto`), então `PUT` exige o objeto completo.

**Decisão:** **não alterar** para `PartialType` nesta rodada.

**Por quê:** mudaria o contrato e o comportamento validado pelos testes e2e, sem
ter sido pedido. O Swagger reflete a realidade atual (campos obrigatórios no
`PUT`). Se o produto quiser `PATCH` parcial, isso deve ser uma decisão explícita
— ver [P-06](#p-06--avaliar-put-parcial-ou-patch).

---

### DEC-009 — Migrations sempre pela conexão direta

**Decisão:** `prisma.config.ts` e `scripts/migrate-deploy.js` preferem
`DATABASE_URL_UNPOOLED`; o runtime usa `DATABASE_URL` (pooled).

**Por quê:** no Neon, DDL e advisory lock não devem passar pelo PgBouncer.

---

### DEC-010 — `.env` gravado em UTF-8 sem BOM

**Contexto:** o PowerShell 5.1 grava UTF-8 **com** BOM por padrão e lê arquivos
sem BOM como ANSI (o que corrompe acentos e até quebra o parser de `.ps1`).

**Decisão:** o script usa `[System.IO.File]::WriteAllText` com
`UTF8Encoding($false)` e o próprio arquivo `.ps1` é salvo com BOM (para o
PowerShell interpretar corretamente).

---

## Pendências

### P-01 — Handler serverless para Vercel

**Prioridade:** alta — bloqueia o deploy em produção.

**Status:** ✅ implementado nesta rodada; falta o deploy real (criar projeto na
Vercel, cadastrar as variáveis e validar o `/health` público).

Entregue:

- `api/index.ts` — aplicação Nest com `ExpressAdapter`, criada uma vez por
  instância e reaproveitada entre invocações (inclui o pool do Prisma);
- `vercel.json` — rewrite de todas as rotas para a função `/api`;
- `tsconfig.api.json` + `npm run typecheck:api` — o handler entra no typecheck;
- `PG_POOL_MAX` — limite do pool `pg` (3–5 em serverless) para não esgotar as
  conexões do Neon.

Validado localmente montando um HTTP server que delega ao handler:
`/health` 200, `/api/docs` 200, login 200, rota protegida 200 com Bearer e 401
sem token.

Passo a passo completo: [07 — Deploy](07-deploy-vercel-neon.md).

---

### P-02 — Schemas de resposta no Swagger

**Prioridade:** média.

Converter as interfaces de resposta (`ViagemResponse`, `LocalResponse`,
`PassagemResponse`, `HotelResponse`, `RoteiroResponse`, `ListaResponse`,
`DiaResponse`, `ResumoViagemResponse`) em classes com `@ApiProperty`, e anotar
os controllers com `@ApiOkResponse({ type: ... })` / `@ApiCreatedResponse`.

**Ganho:** o Swagger passa a mostrar o JSON de retorno, não só o status.

---

### P-03 — Erros por endpoint no Swagger

**Prioridade:** média.

Adicionar `@ApiResponse` com os códigos `ERR-xxx` relevantes por operação
(ex.: `403 ERR-032` nos endpoints de domínio, `409 ERR-040` no registro,
`422 ERR-050` no roteiro).

---

### P-04 — Smoke test automatizado

**Prioridade:** média.

Script `scripts/smoke.ps1` executando login → cria viagem → cria local → lista →
health, contra local **ou** produção, com saída legível e exit code adequado.
Serve como validação pós-deploy em um comando.

---

### P-05 — CI

**Prioridade:** média.

Não existe workflow em `.github/workflows`. Proposta: em PR e push para `main`,
rodar `npm ci` → `typecheck` → `test` → `test:e2e` (PGlite não precisa de
serviço externo, então o pipeline fica simples).

---

### P-06 — Avaliar `PUT` parcial ou `PATCH`

**Prioridade:** baixa (produto).

Hoje `PUT` exige o objeto completo. Se o frontend precisar de atualização
parcial, avaliar `PartialType` (mantendo `PUT`) ou expor `PATCH`. Requer revisão
do contrato e ajuste dos testes.

---

### P-07 — Proteção do seed contra produção

**Prioridade:** baixa.

`prisma db seed` não tem guard de ambiente: com `DATABASE_URL` do Neon (e
`ALLOW_REMOTE_DB=true`), o seed criaria o usuário demo em produção.

**Mitigação sugerida:** o `prisma/seed.ts` recusar execução quando
`NODE_ENV=production` (a menos que `SEED_FORCE=true`), reutilizando
`validarDatabaseUrl`.

---

### P-08 — Limpeza de tokens revogados

**Prioridade:** baixa.

A tabela `TokenRevogado` cresce indefinidamente (só há índice em `expiraEm`).
Avaliar rotina de limpeza (cron/job) dos tokens já expirados.
