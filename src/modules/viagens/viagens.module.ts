import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { DiasController } from './dias.controller';
import { DiasService } from './dias.service';
import { ViagensController } from './viagens.controller';
import { ViagensService } from './viagens.service';

/** Módulo de Viagens e Dias (ARCHITECTURE §4; RN-005 a RN-009, RN-034). */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [ViagensController, DiasController],
  providers: [ViagensService, DiasService],
  exports: [ViagensService, DiasService],
})
export class ViagensModule {}
