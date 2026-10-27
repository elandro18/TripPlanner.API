import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { RoteiroController } from './roteiro.controller';
import { RoteiroService } from './roteiro.service';

/** Módulo do roteiro (cards do Kanban — RN-019 a RN-022). */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [RoteiroController],
  providers: [RoteiroService],
  exports: [RoteiroService],
})
export class RoteiroModule {}
