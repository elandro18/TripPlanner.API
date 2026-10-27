import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { HoteisController } from './hoteis.controller';
import { HoteisService } from './hoteis.service';

/** Módulo de Hotéis (ARCHITECTURE §4; RN-016, RN-017, RN-018). */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [HoteisController],
  providers: [HoteisService],
  exports: [HoteisService],
})
export class HoteisModule {}
