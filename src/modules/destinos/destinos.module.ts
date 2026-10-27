import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { DestinosController } from './destinos.controller';
import { DestinosService } from './destinos.service';

/** Módulo de destinos da viagem. */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [DestinosController],
  providers: [DestinosService],
  exports: [DestinosService],
})
export class DestinosModule {}
