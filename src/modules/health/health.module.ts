import { Module } from '@nestjs/common';
import { PrismaModule } from '../../persistencia/prisma/prisma.module';
import { HealthController } from './health.controller';

/** Health check (`GET /api/v1/health`) — API + banco. */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
