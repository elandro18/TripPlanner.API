#!/usr/bin/env node
/**
 * Aplica as migrations do Prisma (`prisma migrate deploy`) no banco configurado
 * pelas variáveis de ambiente.
 *
 * É chamado pelo script `build` para que o deploy (Vercel) já suba com o schema
 * do PostgreSQL atualizado. Quando não há URL de banco disponível — o caso de
 * um build local sem banco — o passo é simplesmente ignorado (exit 0), para não
 * quebrar `npm run build`.
 *
 * A URL direta (`DATABASE_URL_UNPOOLED`) tem preferência: no Neon a
 * `DATABASE_URL` é a conexão via pooler (PgBouncer), e migrations/DDL com
 * advisory lock devem rodar na conexão direta.
 */
const { spawnSync } = require('node:child_process');

const direta = (process.env.DATABASE_URL_UNPOOLED ?? '').trim();
const pooled = (process.env.DATABASE_URL ?? '').trim();
const url = direta || pooled;

if (!url) {
  console.log('[migrate-deploy] DATABASE_URL não definida — migrations ignoradas (skip).');
  process.exit(0);
}

let cliPrisma;
try {
  cliPrisma = require.resolve('prisma/build/index.js');
} catch {
  console.error('[migrate-deploy] CLI do Prisma não encontrado. Rode `npm install` antes do build.');
  process.exit(1);
}

console.log(`[migrate-deploy] aplicando migrations com prisma migrate deploy (${direta ? 'DATABASE_URL_UNPOOLED' : 'DATABASE_URL'})…`);

const resultado = spawnSync(process.execPath, [cliPrisma, 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});

if (resultado.error) {
  console.error(`[migrate-deploy] falha ao executar o Prisma: ${resultado.error.message}`);
  process.exit(1);
}

process.exit(resultado.status ?? 1);
