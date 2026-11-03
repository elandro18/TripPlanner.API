# 03 — Swagger e health check

Como testar a API manualmente sem Postman, e como saber em 2 segundos se o banco
está conectado.

---

## 1. Endereços

| Recurso | URL (local) |
|---|---|
| Swagger UI | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/docs-json` |
| Health check | `http://localhost:3000/api/v1/health` |
| API | `http://localhost:3000/api/v1` |

> O Swagger fica em `/api/docs` (fora do prefixo `/api/v1`) de propósito: é
> documentação, não contrato de domínio.

---

## 2. Roteiro de teste

1. **Confirme o banco.**
   Abra `GET /api/v1/health` → *Try it out* → *Execute*.
   Esperado: `200` com `"banco": { "status": "ok" }`.

2. **Autentique.**
   `POST /api/v1/auth/login` com `demo@tripplanner.local` / `demo1234`
   (usuário criado pelo seed). O payload já vem preenchido com esses valores.

3. **Autorize.**
   Copie o campo `token` da resposta, clique em **Authorize** e cole **sem** o
   prefixo `Bearer ` (o esquema já é `bearer`). A autorização persiste entre
   recarregamentos (`persistAuthorization`).

4. **Exercite o domínio.**
   `POST /api/v1/viagens` com o exemplo padrão já preenchido. Guarde o `id`
   retornado e use nos endpoints aninhados (`/viagens/{id}/locais`, `/destinos`,
   `/passagens`, `/hoteis`, `/roteiro`).

5. **Confira o resumo.**
   `GET /api/v1/viagens/{id}/resumo` deve refletir os itens criados.

---

## 3. O que foi implementado

### 3.1 `@ApiOperation` em todos os endpoints

As **52 operações** passaram a ter `summary` legível. Antes a UI mostrava apenas
`POST /viagens`; agora mostra *"Cria uma viagem (gera os dias quando há período)"*.

### 3.2 DTOs explícitos com exemplos

Cada campo dos DTOs tem `@ApiProperty`/`@ApiPropertyOptional` com tipo,
restrição e **exemplo real**.

**Por que explícito e não só o plugin do `nest-cli.json`?**
O plugin `@nestjs/swagger` roda apenas sob o Nest CLI (`nest start`/`nest build`).
Execuções via `ts-node` — inclusive o `npm run docs:export` — geravam
`"properties": {}`, ou seja, corpo vazio. Com decoradores explícitos, o schema é
idêntico em qualquer contexto de execução.

Exemplo gerado:

```json
{
  "nome": { "type": "string", "example": "Gramado & Canela", "maxLength": 100 },
  "dataInicio": { "type": "string", "example": "2026-05-12", "description": "Início do período (AAAA-MM-DD)..." }
}
```

### 3.3 `servers` e descrição de uso

`src/config/swagger.setup.ts` publica:

- `http://localhost:3000` — Local (desenvolvimento)
- `<PUBLIC_API_URL>` — Produção, quando a variável existe

A descrição da página traz o passo a passo de login/Authorize e o ambiente +
banco em uso.

### 3.4 Gate por ambiente

| `NODE_ENV` | `SWAGGER_ENABLED` | Resultado |
|---|---|---|
| `development` | ausente | **ligado** |
| `production` | ausente | **desligado** |
| qualquer | `true` | ligado |
| qualquer | `false` | desligado |

Valores aceitos: `true/false`, `1/0`, `yes/no`, `on/off`. Qualquer outro valor
derruba o boot com mensagem clara (evita erro de digitação silencioso).

### 3.5 Exportação do contrato

```powershell
npm run docs:export
```

Gera `openapi.json` na raiz (ignorado pelo Git). Não abre servidor nem conecta
ao banco: usa o modo `preview` do Nest e uma `DATABASE_URL` fictícia apenas para
instanciar o `PrismaService`. Útil para importar no Postman/Insomnia ou
versionar o contrato em outro repositório.

Resultado atual: **29 rotas / 52 operações**.

---

## 4. Health check

`GET /api/v1/health` — **público** (sem Bearer), pensado para monitoramento.

### Contrato

```json
{
  "aplicacao": "TripPlanner.API",
  "ambiente": "development",
  "horario": "2026-11-02T18:20:31.442Z",
  "uptimeSegundos": 42,
  "status": "ok",
  "banco": {
    "status": "ok",
    "latenciaMs": 3,
    "descricao": "localhost:5432/tripplanner_dev"
  }
}
```

| Situação | HTTP | `status` | `banco.status` |
|---|---|---|---|
| API e banco respondendo | `200` | `ok` | `ok` |
| API no ar, banco falhou | `503` | `degradado` | `erro` |

Detalhes:

- Executa `SELECT 1` (via `$queryRaw`) e mede a latência.
- A `descricao` mostra apenas `host:porta/banco` — **nunca** usuário ou senha.
- O teste e2e (`test/health.e2e-spec.ts`) cobre os dois caminhos, inclusive o
  `503` simulando falha do banco.

---

## 5. Limitações conhecidas

1. **Formato de resposta não documentado.** As respostas são `interface`
   (`ViagemResponse`, `LocalResponse`…), não classes — o Swagger lista os status
   (`200`, `201`, `204`) mas não o JSON de retorno. Para resolver, seria preciso
   converter as interfaces em classes com `@ApiProperty` (ver pendência
   [P-02](05-decisoes-e-pendencias.md#p-02--schemas-de-resposta-no-swagger)).
2. **Erros por endpoint não enumerados.** O envelope `[{ id, message, field,
   detail }]` está descrito na página, mas cada endpoint não lista seus códigos
   `ERR-xxx` individualmente.
3. **Swagger em produção desligado por padrão.** Para testar o Neon pela UI, é
   preciso definir `SWAGGER_ENABLED=true` no host e redeployar — o que expõe a
   documentação publicamente.
