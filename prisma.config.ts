import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma CLI (v7).
 *
 * O `DATABASE_URL` aponta para o arquivo SQLite. Em desenvolvimento o padrão é
 * `prisma/dev.db`; os testes sobrescrevem a variável para um arquivo temporário.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
