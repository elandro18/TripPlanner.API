import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { limiteDoPool, mascararUrl } from '../../config/banco-de-dados';
import { Prisma, PrismaClient } from '../../generated/prisma/client';

/** Adapter de conexão aceito pelo cliente (driver adapter do Prisma 7). */
type DriverAdapter = Prisma.PrismaClientOptionsWithAdapter['adapter'];

/**
 * Cliente Prisma do TripPlanner (PostgreSQL via driver adapter `pg`).
 *
 * Em produção/dev a conexão vem do `DATABASE_URL` (Postgres local em
 * desenvolvimento, Neon em produção). Sem a variável a aplicação falha na hora
 * de subir — não há fallback para SQLite.
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
        'DATABASE_URL é obrigatória. Em desenvolvimento rode "npm run db:setup:local"; em produção defina a connection string do Neon.',
      );
    }

    const max = limiteDoPool(process.env.PG_POOL_MAX);

    super({ adapter: adapter ?? new PrismaPg({ connectionString: url as string, max }) });
    this.logger.log(
      `Prisma conectado em ${url ? mascararUrl(url) : 'adapter de teste (PGlite em memória)'}${
        adapter ? '' : ` — pool máx. ${max}`
      }`,
    );
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
