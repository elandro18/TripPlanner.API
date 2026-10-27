import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Cliente Prisma do TripPlanner (SQLite via driver adapter `better-sqlite3`).
 *
 * O `DATABASE_URL` é lido do ambiente; o padrão `file:./prisma/dev.db` mantém a
 * aplicação executável sem configuração adicional em desenvolvimento.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db';
    super({ adapter: new PrismaBetterSqlite3({ url }) });
    this.logger.log(`Prisma conectado em ${url}`);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
