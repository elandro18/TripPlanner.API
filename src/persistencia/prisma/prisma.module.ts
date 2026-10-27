import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Expõe o `PrismaService` para os adaptadores de persistência. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
