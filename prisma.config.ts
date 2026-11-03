import { carregarEnv } from './src/config/load-env';
import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma CLI (v7).
 *
 * O carregamento de `.env` é o mesmo da API (`src/config/load-env.ts`):
 * `.env.local` → `.env.<NODE_ENV>` → `.env` em desenvolvimento, e **nenhum
 * arquivo** em produção (as variáveis vêm do host). Assim o CLI (`migrate`,
 * `studio`, `seed`) sempre fala com o banco do ambiente corrente.
 *
 * A URL direta (`DATABASE_URL_UNPOOLED`) tem preferência para DDL: no Neon a
 * `DATABASE_URL` é a conexão via pooler e migrations/advisory lock devem rodar
 * na conexão direta.
 */
carregarEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node -r ts-node/register/transpile-only prisma/seed.ts',
  },
  datasource: {
    url: (process.env.DATABASE_URL_UNPOOLED ?? '').trim() || process.env.DATABASE_URL,
  },
});
