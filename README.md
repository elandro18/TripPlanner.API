# TripPlanner.API

Backend do **Trip Planner** — API REST (Node.js + NestJS, TypeScript) que serve
o frontend do planejador de viagem.

- Base URL dos contratos: `/api/v1`
- Persistência: **SQLite + Prisma** (dev e produção de instância única)
- Autenticação: JWT próprio (e-mail/senha, bcrypt)
- Documentação de projeto (RDD): `C:\Users\ec64212\Desktop\Branch\Projeto1\TripPlanner`

## Requisitos

- Node.js **22.5+** (recomendado 24; os testes usam `node:sqlite`)
- npm 10+

## Como executar

```bash
npm install            # instala as dependências (gera o Prisma Client)
cp .env.example .env   # ajuste DATABASE_URL/JWT_SECRET
npm run db:migrate     # cria o banco e aplica as migrations
npm run db:seed        # opcional: usuário demo + viagem de exemplo
npm run start:dev      # sobe em http://localhost:3000/api/v1
```

**Login demo (após o seed):** `demo@tripplanner.local` / `demo1234`.

### Swagger (teste manual da API)

Com a API rodando, a documentação interativa fica em
**http://localhost:3000/api/docs** (JSON OpenAPI em `/api/docs-json`).

1. Execute `POST /api/v1/auth/login` (ou `/auth/registrar`) e copie o `token`.
2. Clique em **Authorize** e informe o token (sem o prefixo `Bearer`).

A autorização informada persiste entre recarregamentos da página.

### Scripts

| Script | Descrição |
|---|---|
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm run start` / `start:dev` | Executa a API (`--watch` no dev) |
| `npm run start:prod` | Executa o build (`node dist/main`) |
| `npm run db:migrate` | Cria/aplica migrations (`prisma migrate dev`) |
| `npm run db:deploy` | Aplica migrations em produção (`prisma migrate deploy`) |
| `npm run db:push` | Sincroniza o schema sem migration (uso pontual) |
| `npm run db:seed` | Aplica o seed de desenvolvimento |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm test` | Testes unitários/integração de serviços (Jest) |
| `npm run test:e2e` | Testes HTTP (`supertest`) |
| `npm run typecheck` | Checagem de tipos de `src/` e `test/` |

### Variáveis de ambiente

Descritas em `.env.example`:

| Variável | Padrão | Uso |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente |
| `PORT` | `3000` | Porta HTTP |
| `API_PREFIX` | `api/v1` | Prefixo global |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas (separadas por vírgula) |
| `DATABASE_URL` | `file:./prisma/dev.db` | Banco SQLite |
| `JWT_SECRET` | (dev) | Segredo do JWT — obrigatório em produção |
| `JWT_EXPIRES_IN` | `1h` | Validade do token |
| `BCRYPT_SALT_ROUNDS` | `10` | Custo do hash de senha |

## Estrutura

```
prisma/
├── schema.prisma      # modelo de dados (SQLite)
├── migrations/        # migrations versionadas
└── seed.ts            # dados de demonstração
src/
├── config/            # configuração por variáveis de ambiente (token APP_CONFIG)
├── common/            # erros de domínio, filtro HTTP, paginação, utils
├── persistencia/      # PrismaService + binding porta → repositório Prisma
└── modules/
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
Os testes usam um **SQLite temporário criado a partir das migrations** — sem
rede e sem banco compartilhado.

**Isolamento por dono (RN-004):** todos os endpoints de domínio exigem Bearer e
resolvem o dono pelo token; acesso a recurso de outro usuário → `403` (ERR-032),
exceto listas (404 para não revelar a existência).
**Paginação offset:** `page` (base 0) e `size` (padrão 20, máx. 100).

## Endpoints

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
