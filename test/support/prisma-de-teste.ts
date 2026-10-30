import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaService } from '../../src/persistencia/prisma/prisma.service';

let pglite: PGlite | null = null;
let cliente: PrismaService | null = null;

/**
 * Sobe (uma vez por arquivo de teste) um PostgreSQL em memória — PGlite, o
 * Postgres compilado para WASM — e aplica as migrations versionadas em
 * `prisma/migrations`.
 *
 * O schema agora é PostgreSQL, então não há mais como usar um arquivo SQLite
 * temporário. Cada arquivo de teste roda em um processo do Jest e recebe o seu
 * próprio PGlite: sem rede, sem banco compartilhado e sem interferência entre
 * suítes executadas em paralelo.
 */
export async function prepararBancoDeTeste(): Promise<PrismaService> {
  if (!pglite) {
    const banco = new PGlite();
    await banco.waitReady;
    await aplicarMigracoes(banco);
    pglite = banco;
  }

  if (!cliente) {
    cliente = new PrismaService(new PrismaPGlite(pglite));
    await cliente.$connect();
  }

  return cliente;
}

/** Aplica, em ordem, o SQL de cada migration no banco informado. */
async function aplicarMigracoes(banco: PGlite): Promise<void> {
  const diretorio = join(process.cwd(), 'prisma', 'migrations');
  const pastas = readdirSync(diretorio, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();

  for (const pasta of pastas) {
    const sql = readFileSync(join(diretorio, pasta, 'migration.sql'), 'utf8');
    await banco.exec(sql);
  }
}

/** Cliente Prisma compartilhado pelo arquivo de teste. */
export async function prismaDeTeste(): Promise<PrismaService> {
  return prepararBancoDeTeste();
}

/**
 * Limpa todas as tabelas respeitando as FKs e reinicia as sequências, para que
 * cada cenário comece em id 1.
 */
export async function limparBanco(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Usuario", "Viagem", "Destino", "Dia", "Local", "Passagem", "Hotel", "Roteiro", "Lista", "ListaItem", "TokenRevogado" RESTART IDENTITY CASCADE',
  );
}

/** Fecha o cliente compartilhado e o banco em memória ao fim do arquivo de teste. */
export async function fecharBancoDeTeste(): Promise<void> {
  if (cliente) {
    await cliente.$disconnect();
    cliente = null;
  }
  if (pglite) {
    await pglite.close();
    pglite = null;
  }
}

afterAll(async () => {
  await fecharBancoDeTeste();
});
