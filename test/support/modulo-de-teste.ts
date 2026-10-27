import { Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_CONFIG } from '../../src/config/app-config';
import { PrismaTokenRevogadoRepository } from '../../src/modules/auth/prisma-token-revogado.repository';
import { TOKEN_REVOGADO_REPOSITORY } from '../../src/modules/auth/token-revogado.repository';
import { DESTINOS_REPOSITORY } from '../../src/modules/destinos/destinos.repository';
import { PrismaDestinosRepository } from '../../src/modules/destinos/prisma-destinos.repository';
import { PrismaHoteisRepository } from '../../src/modules/hoteis/prisma-hoteis.repository';
import { HOTEL_REPOSITORY } from '../../src/modules/hoteis/hoteis.repository';
import { LOCAIS_REPOSITORY } from '../../src/modules/locais/locais.repository';
import { PrismaLocaisRepository } from '../../src/modules/locais/prisma-locais.repository';
import { LISTAS_REPOSITORY } from '../../src/modules/listas/listas.repository';
import { PrismaListasRepository } from '../../src/modules/listas/prisma-listas.repository';
import { PASSAGEM_REPOSITORY } from '../../src/modules/passagens/passagens.repository';
import { PrismaPassagensRepository } from '../../src/modules/passagens/prisma-passagens.repository';
import { PrismaVinculosRoteiroRepository } from '../../src/modules/roteiro/prisma-vinculos-roteiro.repository';
import { VINCULOS_ROTEIRO_REPOSITORY } from '../../src/modules/roteiro/vinculos-roteiro.repository';
import { PrismaUsuariosRepository } from '../../src/modules/usuarios/prisma-usuarios.repository';
import { USUARIOS_REPOSITORY } from '../../src/modules/usuarios/usuarios.repository';
import { DIAS_REPOSITORY } from '../../src/modules/viagens/dias.repository';
import { PrismaDiasRepository } from '../../src/modules/viagens/prisma-dias.repository';
import { PrismaViagensRepository } from '../../src/modules/viagens/prisma-viagens.repository';
import { VIAGENS_REPOSITORY } from '../../src/modules/viagens/viagens.repository';
import { PrismaService } from '../../src/persistencia/prisma/prisma.service';
import { criarConfigDeTeste } from './config-de-teste';
import { limparBanco, prismaDeTeste } from './prisma-de-teste';

/** Repositórios Prisma reais, ligados ao banco SQLite temporário. */
export const REPOSITORIOS_PRISMA: Provider[] = [
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
];

export interface ContextoDeTeste {
  readonly modulo: TestingModule;
  readonly prisma: PrismaService;
}

/**
 * Módulo de teste com os repositórios Prisma reais sobre um SQLite temporário.
 * O banco é limpo antes de cada módulo para isolar os cenários.
 */
export async function criarModuloDeDominio(providers: Provider[]): Promise<ContextoDeTeste> {
  const prisma = await prismaDeTeste();
  await limparBanco(prisma);

  const modulo = await Test.createTestingModule({
    providers: [
      { provide: APP_CONFIG, useValue: criarConfigDeTeste() },
      { provide: PrismaService, useValue: prisma },
      ...REPOSITORIOS_PRISMA,
      ...providers,
    ],
  }).compile();

  return { modulo, prisma };
}
