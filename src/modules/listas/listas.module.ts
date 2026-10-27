import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { ListasController } from './listas.controller';
import { ListasService } from './listas.service';

/** Módulo de listas/checklists. */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [ListasController],
  providers: [ListasService],
  exports: [ListasService],
})
export class ListasModule {}
