import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthModule } from '../auth/auth.module';
import { PassagensController } from './passagens.controller';
import { PassagensService } from './passagens.service';

/** Módulo de Passagens (ARCHITECTURE §4; RN-013, RN-014, RN-015). */
@Module({
  imports: [AuthModule, PersistenciaModule],
  controllers: [PassagensController],
  providers: [PassagensService],
  exports: [PassagensService],
})
export class PassagensModule {}
