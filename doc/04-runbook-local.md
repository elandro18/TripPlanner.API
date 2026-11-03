# 04 — Runbook local

Passo a passo operacional: subir do zero, tarefas do dia a dia e o que fazer
quando algo quebra.

---

## 1. Primeiro setup (máquina nova)

```powershell
# 1. dependências (roda `prisma generate` no postinstall)
npm install

# 2. provisiona PostgreSQL local + .env + migrations + seed
npm run db:setup:local

# 3. confere o ambiente
npm run env:check

# 4. sobe em watch mode
npm run start:dev
```

O passo 2 pede a senha do usuário `postgres` (a definida na instalação do
PostgreSQL). É a **única** vez que uma senha é digitada — a senha da aplicação é
gerada aleatoriamente pelo script e gravada no `.env`.

Saída esperada do `env:check`:

```text
Ambiente: development
Arquivos .env carregados: C:\Users\eland\repos\TripPlanner.API\.env
Porta: 3000 · prefixo: /api/v1
Banco: localhost:5432/tripplanner_dev (local, ssl)
Swagger habilitado: sim
CORS: http://localhost:5173

Ambiente OK.
```

Saída esperada do `start:dev`:

```text
[Bootstrap] Ambiente "development" — arquivos .env carregados: ...\.env
[AppConfig] Ambiente "development" usando banco localhost:5432/tripplanner_dev (local, ssl)
[PrismaService] Prisma conectado em postgresql://tripplanner:***@localhost:5432/tripplanner_dev?schema=public
[Bootstrap] TripPlanner.API ouvindo em http://localhost:3000/api/v1
[Bootstrap] Swagger: http://localhost:3000/api/docs
```

Login demo: `demo@tripplanner.local` / `demo1234`.

---

## 2. O que o `db:setup:local` faz

1. localiza o `psql` (PATH ou `C:\Program Files\PostgreSQL\<versão>\bin`);
2. reaproveita a senha do `.env` se o role já existir (idempotência);
3. pede a senha do superusuário e testa a conexão;
4. cria/atualiza o role `tripplanner` (`LOGIN CREATEDB`, senha aleatória);
5. cria o banco `tripplanner_dev` com esse owner, se não existir;
6. grava `DATABASE_URL` no `.env` em UTF-8 sem BOM, preservando as demais
   variáveis;
7. roda `prisma migrate deploy` e `prisma db seed` — chamando o **CLI do Prisma
   direto** (`node node_modules/prisma/build/index.js`), sem `npx`.

Flags úteis:

```powershell
# só provisiona o banco, sem migrations/seed
powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1 -SkipMigrate

# migrations sem seed
powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1 -SkipSeed
```

---

## 3. Tarefas do dia a dia

| Quero… | Comando |
|---|---|
| Subir em watch | `npm run start:dev` |
| Só compilar | `npm run build` |
| Rodar como produção local | `npm run build` + `npm run start:prod` |
| Criar migration nova | editar `prisma/schema.prisma` → `npm run db:migrate:local` |
| Aplicar migrations existentes | `npm run db:deploy` |
| Reaplicar o seed | `npm run db:seed:local` |
| Zerar o banco local | `npm run db:reset:local` (apaga dados, reaplica seed) |
| Inspecionar dados | `npm run db:studio` |
| Ver o ambiente | `npm run env:check` |
| Gerar `openapi.json` | `npm run docs:export` |
| Testes unitários | `npm test` |
| Testes HTTP (e2e) | `npm run test:e2e` |
| Checar tipos | `npm run typecheck` |

> `npm run db:reset:local` é destrutivo: recria o schema do zero. Use quando
> quiser um estado limpo igual ao de um colega.

---

## 4. Testar o Neon a partir da máquina local (opcional)

Por padrão é **bloqueado**. Para liberar conscientemente:

```powershell
$env:ALLOW_REMOTE_DB = 'true'
$env:DATABASE_URL = 'postgresql://...@ep-xxx-pooler...neon.tech/neondb?sslmode=require'
npm run start:dev
```

Consequências a ter em mente:

- você estará lendo e **escrevendo** no banco de produção;
- o seed não deve ser rodado nesse estado (`npm run db:seed:local` criaria o
  usuário demo em produção);
- ao terminar, feche o terminal ou remova a variável — o bloqueio volta no
  próximo boot.

---

## 5. Troubleshooting

| Mensagem | Causa | Solução |
|---|---|---|
| `psql.exe não encontrado` | PostgreSQL fora do caminho padrão | informe o caminho ou adicione `bin` ao PATH |
| `Não foi possível conectar ao PostgreSQL` | senha do superusuário incorreta | rode de novo e digite a senha certa |
| `DATABASE_URL é obrigatória` | `.env` ausente | `npm run db:setup:local` |
| `DATABASE_URL aponta para o Neon (produção) em ambiente "development"` | URL de produção em dev | use a URL local ou `ALLOW_REMOTE_DB=true` |
| `NODE_ENV=production, mas DATABASE_URL aponta para o host local` | env trocada | em produção use a URL do Neon; em dev remova `NODE_ENV=production` |
| `JWT_SECRET é obrigatório em produção` | `NODE_ENV=production` sem segredo | definir `JWT_SECRET` no host |
| `database "tripplanner_dev" does not exist` | migrations não rodaram | `npm run db:migrate:local` |
| `E-mail já cadastrado` (ERR-040) | seed já criou o demo | use `POST /auth/login` em vez de `/registrar` |
| `Port 3000 already in use` | processo anterior vivo | feche o terminal antigo ou ajuste `PORT` |
| `npm error could not determine executable to run` | `npx` falhando dentro do PowerShell aninhado | já corrigido: o script chama o CLI direto (`node node_modules/prisma/build/index.js`) |
| `'ts-node' não é reconhecido como comando` | `node_modules/.bin` fora do PATH do processo que o Prisma spawna | já corrigido: o seed usa `node -r ts-node/register/transpile-only` (não depende de PATH) |
| Erro de TLS/genérico no Neon | falta `?sslmode=require` | acrescente ao final da URL |
| `P1001: Can't reach database` no Neon | IP/rede ou URL pooled errada | confira a connection string no painel do Neon |

---

## 6. Verificação rápida de saúde do ambiente

Sequência de 30 segundos:

```powershell
npm run env:check                       # config válida?
curl http://localhost:3000/api/v1/health # banco responde?
```

`health` retornando `200` com `banco.status = "ok"` significa: API no ar, banco
acessível, credenciais corretas, TLS ok.
