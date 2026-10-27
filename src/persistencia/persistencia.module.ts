import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistencia/prisma/prisma.module';
import { PrismaTokenRevogadoRepository } from '../modules/auth/prisma-token-revogado.repository';
import { TOKEN_REVOGADO_REPOSITORY } from '../modules/auth/token-revogado.repository';
import { DestinosRepository, DESTINOS_REPOSITORY } from '../modules/destinos/destinos.repository';
import { PrismaDestinosRepository } from '../modules/destinos/prisma-destinos.repository';
import { PrismaHoteisRepository } from '../modules/hoteis/prisma-hoteis.repository';
import { HOTEL_REPOSITORY } from '../modules/hoteis/hoteis.repository';
import { LOCAIS_REPOSITORY } from '../modules/locais/locais.repository';
import { PrismaLocaisRepository } from '../modules/locais/prisma-locais.repository';
import { PrismaListasRepository } from '../modules/listas/prisma-listas.repository';
import { LISTAS_REPOSITORY } from '../modules/listas/listas.repository';
import { PASSAGEM_REPOSITORY } from '../modules/passagens/passagens.repository';
import { PrismaPassagensRepository } from '../modules/passagens/prisma-passagens.repository';
import { PrismaVinculosRoteiroRepository } from '../modules/roteiro/prisma-vinculos-roteiro.repository';
import { VINCULOS_ROTEIRO_REPOSITORY } from '../modules/roteiro/vinculos-roteiro.repository';
import { USUARIOS_REPOSITORY } from '../modules/usuarios/usuarios.repository';
import { PrismaUsuariosRepository } from '../modules/usuarios/prisma-usuarios.repository';
import { DIAS_REPOSITORY } from '../modules/viagens/dias.repository';
import { PrismaDiasRepository } from '../modules/viagens/prisma-dias.repository';
import { PrismaViagensRepository } from '../modules/viagens/prisma-viagens.repository';
import { VIAGENS_REPOSITORY } from '../modules/viagens/viagens.repository';

/**
 * Camada de persistência (adapters): liga as **portas** de repositório às
 * implementações Prisma (SQLite).
 *
 * Centralizar o binding aqui evita que os módulos de domínio dependam uns dos
 * outros: eles importam apenas `PersistenciaModule` e recebem as portas por
 * injeção. Os testes substituem qualquer porta por um dublê via
 * `overrideProvider` ou usam um banco SQLite temporário.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: USUARIOS_REPOSITORY, useClass: PrismaUsuariosRepository },
    { provide: VIAGENS_REPOSITORY, useClass: PrismaViagensRepository },
    { provide: DIAS_REPOSITORY, useClass: PrismaDiasRepository },
    { provide: LOCAIS_REPOSITORY, useClass: PrismaLocaisRepository },
    { provide: PASSAGEM_REPOSITORY, useClass: PrismaPassagensRepository },
    { provide: HOTEL_REPOSITORY, useClass: PrismaHoteisRepository },
    { provide: VINCULOS_ROTEIRO_REPOSITORY, useClass: PrismaVinculosRoteiroRepository },
    { provide: DESTINOS_REPOSITORY, useClass: PrismaDestinosRepository },
    { provide: LISTAS_REPOSITORY, useClass: PrismaListasRepository },
    { provide: TOKEN_REVOGADO_REPOSITORY, useClass: PrismaTokenRevogadoRepository },
  ],
  exports: [
    USUARIOS_REPOSITORY,
    VIAGENS_REPOSITORY,
    DIAS_REPOSITORY,
    LOCAIS_REPOSITORY,
    PASSAGEM_REPOSITORY,
    HOTEL_REPOSITORY,
    VINCULOS_ROTEIRO_REPOSITORY,
    DESTINOS_REPOSITORY,
    LISTAS_REPOSITORY,
    TOKEN_REVOGADO_REPOSITORY,
  ],
})
export class PersistenciaModule {}
