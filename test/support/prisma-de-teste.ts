import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaService } from '../../src/persistencia/prisma/prisma.service';

let url: string | null = null;
let cliente: PrismaService | null = null;

/**
 * Cria (uma vez por processo do Jest) um banco SQLite temporário aplicando as
 * migrations versionadas em `prisma/migrations`.
 *
 * Cada arquivo de teste roda em um processo isolado, então cada um recebe um
 * banco próprio — sem interferência entre suítes executadas em paralelo.
 */
export function prepararBancoDeTeste(): string {
  if (!url) {
    const diretorio = mkdtempSync(join(tmpdir(), 'tripplanner-api-'));
    const arquivo = join(diretorio, 'test.db').replace(/\\/g, '/');
    url = `file:${arquivo}`;
    process.env.DATABASE_URL = url;

    aplicarMigracoes(arquivo);
  }

  process.env.DATABASE_URL = url;
  return url;
}

/** Aplica, em ordem, o SQL de cada migration no arquivo informado. */
function aplicarMigracoes(arquivo: string): void {
  const diretorio = join(process.cwd(), 'prisma', 'migrations');
  const pastas = readdirSync(diretorio, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();

  const banco = new DatabaseSync(arquivo);
  try {
    for (const pasta of pastas) {
      const sql = readFileSync(join(diretorio, pasta, 'migration.sql'), 'utf8');
      banco.exec(sql);
    }
  } finally {
    banco.close();
  }
}

/** Cliente Prisma compartilhado pelo arquivo de teste. */
export async function prismaDeTeste(): Promise<PrismaService> {
  prepararBancoDeTeste();
  if (!cliente) {
    cliente = new PrismaService();
    await cliente.$connect();
  }
  return cliente;
}

/** Limpa todas as tabelas respeitando a ordem das FKs. */
export async function limparBanco(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.tokenRevogado.deleteMany(),
    prisma.listaItem.deleteMany(),
    prisma.lista.deleteMany(),
    prisma.roteiro.deleteMany(),
    prisma.hotel.deleteMany(),
    prisma.passagem.deleteMany(),
    prisma.local.deleteMany(),
    prisma.dia.deleteMany(),
    prisma.destino.deleteMany(),
    prisma.viagem.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
  // Reinicia as sequências para que cada cenário comece em id 1.
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence').catch(() => undefined);
}

/** Fecha o cliente compartilhado ao fim do arquivo de teste. */
export async function fecharBancoDeTeste(): Promise<void> {
  if (cliente) {
    await cliente.$disconnect();
    cliente = null;
  }
}

afterAll(async () => {
  await fecharBancoDeTeste();
});
