import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PersistenciaModule } from './persistencia/persistencia.module';
import { AuthModule } from './modules/auth/auth.module';
import { DestinosModule } from './modules/destinos/destinos.module';
import { HoteisModule } from './modules/hoteis/hoteis.module';
import { LocaisModule } from './modules/locais/locais.module';
import { ListasModule } from './modules/listas/listas.module';
import { PassagensModule } from './modules/passagens/passagens.module';
import { RoteiroModule } from './modules/roteiro/roteiro.module';
import { ViagensModule } from './modules/viagens/viagens.module';

@Module({
  imports: [
    AppConfigModule,
    PersistenciaModule,
    AuthModule,
    ViagensModule,
    DestinosModule,
    LocaisModule,
    PassagensModule,
    HoteisModule,
    RoteiroModule,
    ListasModule,
  ],
})
export class AppModule {}
