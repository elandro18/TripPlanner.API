import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../generated/prisma/client';

/** Adapter de conexão aceito pelo cliente (driver adapter do Prisma 7). */
type DriverAdapter = Prisma.PrismaClientOptionsWithAdapter['adapter'];

/** Esconde a senha da URL antes de escrever no log. */
function descreverConexao(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '<DATABASE_URL inválida>';
  }
}

/**
 * Cliente Prisma do TripPlanner (PostgreSQL via driver adapter `pg`).
 *
 * Em produção/dev a conexão vem do `DATABASE_URL` (Postgres hospedado). Sem a
 * variável a aplicação falha na hora de subir — não há mais fallback para um
 * arquivo SQLite local.
 *
 * O parâmetro opcional existe apenas para os testes, que injetam um PGlite em
 * memória no lugar de um Postgres real.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Optional() adapter?: DriverAdapter) {
    const url = process.env.DATABASE_URL?.trim();

    if (!adapter && (!url || url.length === 0)) {
      throw new Error(
        'DATABASE_URL é obrigatória: informe a connection string do PostgreSQL (ex.: Neon) antes de subir a API.',
      );
    }

    super({ adapter: adapter ?? new PrismaPg({ connectionString: url as string }) });
    this.logger.log(`Prisma conectado em ${url ? descreverConexao(url) : 'adapter de teste (PGlite em memória)'}`);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
