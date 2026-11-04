# 07 — Deploy: Vercel + Neon

Como a API vai para produção: **Neon** como PostgreSQL gerenciado e **Vercel**
como runtime serverless. Local continua no PostgreSQL 18.

---

## 1. Visão geral

```mermaid
flowchart LR
    subgraph local["Máquina local"]
        A["npm run start:dev"] --> B[("PostgreSQL 18\nlocalhost:5432\ntripplanner_dev")]
    end
    subgraph prod["Produção"]
        C["Browser / Frontend"] --> D["Vercel\napi/index.ts (serverless)"]
        D --> E[("Neon\nPostgreSQL gerenciado")]
    end
    B -. ".env" .-> A
    E -. "DATABASE_URL\n(variáveis da Vercel)" .-> D
```

| Ambiente | Banco | Como conecta |
|---|---|---|
| Desenvolvimento | PostgreSQL 18 local | `.env` → `DATABASE_URL` (`localhost`) |
| Testes | PGlite em memória | adapter injetado, sem rede |
| Produção | Neon | env vars da Vercel (`NODE_ENV=production`) |

As regras que impedem confusão entre os dois estão em
[02 — Ambientes](02-ambientes.md#3-regras-de-validação-da-database_url).

---

## 2. O que já está pronto no código

| Arquivo | Papel |
|---|---|
| `api/index.ts` | Entrypoint serverless: cria a aplicação Nest uma vez por instância e reaproveita entre invocações |
| `src/common/utils/url-vercel.ts` | Restaura o caminho original mascarado pelo rewrite da Vercel |
| `vercel.json` | Redireciona `/` para `/api/docs` e reescreve as rotas para a função `/api`, preservando o caminho em `?caminhoOriginal=...` |
| `tsconfig.api.json` | Typecheck do handler (o build do Nest continua em `src/`) |
| `src/persistencia/prisma/prisma.service.ts` | Pool `pg` com limite configurável (`PG_POOL_MAX`) |
| `scripts/migrate-deploy.js` | Aplica migrations no build, pela conexão **direta** do Neon |

Por que o handler é necessário: a Vercel **não** executa `node dist/main`
(processo long-lived). Ela invoca uma função por requisição. O `api/index.ts`
cria a aplicação com `ExpressAdapter` e guarda a promise em cache — o mesmo
padrão de "singleton por instância" que evita recriar o pool do Prisma a cada
request.

### 2.1 Por que o rewrite carrega o caminho

Um detalhe que quebra a maioria dos deploys de Nest na Vercel: `rewrites` para
uma **função** mascaram o caminho. Com `destination: "/api"`, toda requisição
chega à função como `/` — inclusive `/api/docs`. O sintoma típico é o envelope
de erro da própria API:

```json
[{ "id": "ERR-000", "message": "Cannot GET /", "field": null, "detail": "NotFoundException" }]
```

Solução adotada:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/api?caminhoOriginal=$1" }] }
```

O `$1` carrega o caminho real; `normalizarUrlDeFuncao()`
(`src/common/utils/url-vercel.ts`) reconstrói a URL antes de entregar ao
Express/Nest. Os demais query params (`?page=0&size=5`) seguem junto.

`GET /` não é rota da API: redireciona para `/api/docs`.

### 2.2 Por que o Swagger UI pode perder os assets

O HTML gerado pelo `swagger-ui-express` referencia os arquivos com caminho
**relativo** (`./swagger-ui-bundle.js`, `./swagger-ui.css`). O
`swagger-ui-init.js` é gerado em memória — por isso ele costuma carregar mesmo
quando os demais falham.

No bundle serverless, arquivos lidos via `fs` em runtime (é o caso de
`node_modules/swagger-ui-dist`) podem **não ser incluídos** pela análise de
dependências da Vercel. Sintoma no navegador:

```text
Uncaught ReferenceError: SwaggerUIBundle is not defined
    at /api/docs/swagger-ui-init.js
```

Mitigação dupla (as duas já aplicadas):

1. `vercel.json` → `functions["api/index.ts"].includeFiles` com
   `node_modules/swagger-ui-dist/**` (força a inclusão dos assets);
2. `src/config/swagger.setup.ts` → middleware de fallback que responde `302`
   para o mesmo arquivo no CDN (jsDelivr, versão fixa) **somente quando** o
   `swagger-ui-express` não encontrou o arquivo (`next()`).

Localmente o fallback nunca dispara: os arquivos existem em `node_modules` e são
servidos pelo próprio `swagger-ui-express`.

**Sem engine nativa:** o generator `prisma-client` (Prisma 7) + driver adapter
`@prisma/adapter-pg` geram apenas TypeScript — nenhum `.node`/`.so` para
empacotar. Isso elimina a maior fonte de problemas de Prisma em serverless.

---

## 3. Passo 1 — Criar o banco no Neon

1. Acesse <https://console.neon.tech> e crie um projeto (região mais próxima dos
   usuários, ex.: `sa-east-1`).
2. No projeto, abra **Connection Details** e copie **as duas** strings:

| String | Host | Vai em |
|---|---|---|
| **Pooled** (com `-pooler`) | `ep-xxx-pooler.sa-east-1.aws.neon.tech` | `DATABASE_URL` |
| **Direct** (sem `-pooler`) | `ep-xxx.sa-east-1.aws.neon.tech` | `DATABASE_URL_UNPOOLED` |

Exemplo:

```text
DATABASE_URL=postgresql://usuario:senha@ep-cool-123-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://usuario:senha@ep-cool-123.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

> Sempre com `?sslmode=require`. O Neon rejeita conexão sem TLS e a API emite
> warning no log quando detecta banco remoto sem SSL.

**Não** rode o seed em produção. O usuário demo é só de desenvolvimento; em
produção, crie contas via `POST /api/v1/auth/registrar`.

---

## 4. Passo 2 — Criar o projeto na Vercel

1. <https://vercel.com/new> → importe o repositório da API.
2. Configurações do projeto:

| Campo | Valor |
|---|---|
| Framework Preset | **Other** |
| Root Directory | a raiz do repositório da API |
| Build Command | `npm run build` |
| Output Directory | *(vazio)* |
| Install Command | `npm install` (padrão) |

3. Em **Environment Variables**, adicione as variáveis da seção 5 no escopo
   **Production** (e **Preview**, se quiser testar em preview).
4. **Deploy**.

> A Vercel define `NODE_ENV=production` automaticamente no runtime. Não é
> necessário criar essa variável à mão — e criá-la pode fazer o `npm install`
> pular as devDependencies (o CLI do Prisma é uma delas).

---

## 5. Variáveis de ambiente (produção)

| Variável | Obrigatória | Valor |
|---|---|---|
| `DATABASE_URL` | ✅ | connection string **pooled** do Neon |
| `DATABASE_URL_UNPOOLED` | ✅ | connection string **direta** (migrations) |
| `JWT_SECRET` | ✅ | segredo forte (ver abaixo) |
| `CORS_ORIGINS` | ✅ | domínio do frontend, ex.: `https://app.exemplo.com` |
| `PG_POOL_MAX` | recomendado | `5` (cada instância serverless abre seu pool) |
| `SWAGGER_ENABLED` | opcional | `false` (padrão em produção) |
| `PUBLIC_API_URL` | opcional | `https://sua-api.vercel.app` (aparece no OpenAPI) |
| `JWT_EXPIRES_IN` | opcional | `1h` |
| `BCRYPT_SALT_ROUNDS` | opcional | `10` |

Gerar o `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Não defina `PORT` (a Vercel gerencia) nem `NODE_ENV`.

---

## 6. O que acontece no deploy

```mermaid
flowchart TD
    A["vercel build"] --> B["npm install\n(postinstall → prisma generate)"]
    B --> C["npm run build"]
    C --> C1["node scripts/migrate-deploy.js\nprisma migrate deploy (DATABASE_URL_UNPOOLED)"]
    C1 --> C2["nest build → dist/ (validação de tipos)"]
    C1 -->|"falha"| X["deploy abortado"]
    C2 --> D["empacotamento de api/index.ts"]
    D --> E["função publicada"]
```

- **Migrations são aplicadas no build.** Se a conexão direta falhar, o deploy
  para — melhor falhar cedo do que subir com schema desatualizado.
- Sem `DATABASE_URL`, o script de migrations sai com código 0 (não quebra build
  local sem banco).
- O `dist/` gerado não é usado pela função; serve para validar o build.

---

## 7. Validação depois do deploy

```powershell
# 1. saúde (público, sem token)
Invoke-RestMethod https://sua-api.vercel.app/api/v1/health

# 2. Swagger (somente com SWAGGER_ENABLED=true)
Start-Process https://sua-api.vercel.app/api/docs

# 3. criar a primeira conta
Invoke-RestMethod https://sua-api.vercel.app/api/v1/auth/registrar -Method Post `
  -ContentType 'application/json' `
  -Body '{"nome":"Admin","email":"admin@exemplo.com","senha":"senha-forte"}'
```

Esperado no health:

```json
{
  "status": "ok",
  "ambiente": "production",
  "banco": { "status": "ok", "latenciaMs": 42, "descricao": "ep-xxx-pooler....neon.tech:5432/neondb" }
}
```

Se `banco.status = "erro"` e o HTTP for **503**, o problema é conexão com o
Neon — veja a seção 9.

---

## 8. Migrations depois do primeiro deploy

Fluxo normal (automático):

1. alterar `prisma/schema.prisma` localmente;
2. `npm run db:migrate:local` → cria a migration em `prisma/migrations/`;
3. commit + push → a Vercel aplica no Neon durante o build.

Aplicar manualmente (sem redeploy), a partir da máquina local:

```powershell
$env:NODE_ENV = 'production'
$env:DATABASE_URL_UNPOOLED = 'postgresql://...direta...neon.tech/neondb?sslmode=require'
npm run db:deploy
```

> Cuidado: com `NODE_ENV=production` o projeto deixa de carregar o `.env` —
> todas as variáveis precisam vir do ambiente, como acima.

---

## 9. Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `404 NOT_FOUND` em `/api/v1/...` | `vercel.json` ausente ou desatualizado | confirme o `rewrite` com `caminhoOriginal=$1` e redeploy |
| Corpo `[{"id":"ERR-000",...}]` com `Cannot GET /` | rewrite mascarou o caminho | use o `vercel.json` deste repositório (o caminho vem em `?caminhoOriginal=`) |
| `/api/docs` em 404 com a API respondendo | `SWAGGER_ENABLED` desligado (padrão em produção) | defina `SWAGGER_ENABLED=true` no escopo Production e redeploy |
| `SwaggerUIBundle is not defined` na página | os `.js/.css` de `swagger-ui-dist` não entraram no bundle serverless (só o `swagger-ui-init.js`, que é gerado em memória, carregou) | ✅ tratado: `functions.includeFiles` no `vercel.json` + fallback 302 para o CDN em `src/config/swagger.setup.ts` |
| `500` com `ERR-099` no corpo | falha na inicialização (env/banco) | veja os **Runtime Logs** da função |
| `Can't reach database server` | URL errada, projeto Neon suspenso ou região | confira a string e o status do projeto no Neon |
| `too many connections` | pool alto × muitas instâncias | `PG_POOL_MAX=3` e use a URL **pooled** |
| `timeout` / `FUNCTION_INVOCATION_TIMEOUT` | cold start + Neon suspenso | upgrade de compute/compute sempre ativo, ou plano pago |
| Migrations falham no build | falta `DATABASE_URL_UNPOOLED` | cadastre a variável no escopo Production |
| `prisma: command not found` no build | `npm install` pulou devDependencies | remova `NODE_ENV` das env vars do projeto |
| Primeira requisição lenta (2–5 s) | Neon *autosuspend* (plano gratuito) | normal; aquece ao primeiro acesso |

Como ver logs: Vercel → projeto → **Deployments** → deploy → **Functions** →
`api/index` → **Runtime Logs**.

---

## 10. Segurança

- `JWT_SECRET` **obrigatório**: sem ele a API nem sobe em produção.
- `SWAGGER_ENABLED` desligado por padrão — ligar expõe toda a superfície da API.
- `CORS_ORIGINS` deve listar apenas o domínio real do frontend.
- Nenhum `.env` é lido em produção: só as variáveis do painel.
- A `DATABASE_URL` aparece mascarada nos logs (`***`).
- Seed nunca em produção (ver pendência
  [P-07](05-decisoes-e-pendencias.md#p-07--proteção-do-seed-contra-produção)).

---

## 11. Limites e custos (referência)

| Item | Gratuito | Observação |
|---|---|---|
| Neon | 1 projeto, compute com autosuspend | primeira query após ocioso fica lenta |
| Vercel Hobby | execuções limitadas, timeout curto | cold start frequente em projeto sem tráfego |
| Conexões | limite do plano Neon | daí o `PG_POOL_MAX` baixo |

Para produção com tráfego real, avalie o plano pago do Neon (compute sempre
ativo) — elimina o cold start de banco, que é o principal fator de latência.

---

## 12. Checklist do primeiro deploy

- [ ] Projeto criado no Neon
- [ ] `DATABASE_URL` (pooled) copiada
- [ ] `DATABASE_URL_UNPOOLED` (direta) copiada
- [ ] `JWT_SECRET` gerado e cadastrado
- [ ] `CORS_ORIGINS` com o domínio do frontend
- [ ] `PG_POOL_MAX=5`
- [ ] `SWAGGER_ENABLED=true` (apenas se quiser testar pela UI em produção)
- [ ] Repositório importado na Vercel (preset **Other**)
- [ ] Build Command = `npm run build`
- [ ] Deploy executado sem erro de migration
- [ ] `GET /api/v1/health` → `200` com `banco.status = "ok"`
- [ ] `POST /api/v1/auth/registrar` cria a primeira conta
- [ ] Login retorna token e um endpoint protegido funciona
- [ ] Frontend apontando para a URL de produção
