import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma CLI (v7).
 *
 * O `DATABASE_URL` aponta para o PostgreSQL (Neon). Não há mais fallback para
 * arquivo SQLite: sem a variável, os comandos que falam com o banco (migrate,
 * studio, seed) falham. Os testes injetam um PGlite em memória pelo adapter.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
