import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { LocaisController } from './locais.controller';
import { LocaisService } from './locais.service';

/** Módulo de Locais (ARCHITECTURE §4; RN-010, RN-011, RN-012, RN-035). */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [LocaisController],
  providers: [LocaisService],
  exports: [LocaisService],
})
export class LocaisModule {}
