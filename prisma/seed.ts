import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const url = process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db';
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const EMAIL_DEMO = 'demo@tripplanner.local';
const SENHA_DEMO = 'demo1234';

async function main(): Promise<void> {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_DEMO } });
  if (existente) {
    console.log(`Seed já aplicado (usuário ${EMAIL_DEMO}).`);
    return;
  }

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
  const usuario = await prisma.usuario.create({
    data: { nome: 'Ana Beatriz Moraes', email: EMAIL_DEMO, senhaHash },
  });

  const viagem = await prisma.viagem.create({
    data: {
      usuarioId: usuario.id,
      nome: 'Gramado & Canela',
      destino: 'Gramado, RS',
      comDatas: true,
      dataInicio: '2026-05-12',
      dataFim: '2026-05-15',
      moeda: 'BRL',
      ativa: true,
      capaUrl: 'https://picsum.photos/seed/gramado-serra/1600/1000',
    },
  });

  const gramado = await prisma.destino.create({
    data: {
      viagemId: viagem.id,
      nome: 'Gramado',
      cidade: 'Gramado',
      pais: 'Brasil',
      ordem: 0,
      dataInicio: '2026-05-12',
      dataFim: '2026-05-13',
      lat: -29.3785,
      lng: -50.8727,
    },
  });
  const canela = await prisma.destino.create({
    data: {
      viagemId: viagem.id,
      nome: 'Canela',
      cidade: 'Canela',
      pais: 'Brasil',
      ordem: 1,
      dataInicio: '2026-05-14',
      dataFim: '2026-05-15',
      lat: -29.3656,
      lng: -50.8123,
    },
  });

  const dias = [] as Array<{ id: number }>;
  for (const [indice, data] of ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15'].entries()) {
    dias.push(
      await prisma.dia.create({
        data: {
          viagemId: viagem.id,
          numero: indice + 1,
          data,
          destinoId: indice < 2 ? gramado.id : canela.id,
        },
      }),
    );
  }

  const lagoNegro = await prisma.local.create({
    data: {
      viagemId: viagem.id,
      nome: 'Lago Negro',
      categoria: 'natureza',
      endereco: 'Av. Borges de Medeiros, s/n',
      cidade: 'Gramado',
      horarioPrevisto: '10:30',
      horarioFim: '12:00',
      duracaoMin: 90,
      custoCentavos: 0,
      observacoes: 'Aluguel de pedalinhos opcional. Levar casaco.',
      fotoUrl: 'https://picsum.photos/seed/lago-negro/900/700',
      lat: -29.3792,
      lng: -50.8769,
      geoStatus: 'confirmado',
    },
  });
  const cafe = await prisma.local.create({
    data: {
      viagemId: viagem.id,
      nome: 'Café Colonial Bela Vista',
      categoria: 'restaurante',
      endereco: 'Rua Bela Vista, 100',
      cidade: 'Gramado',
      horarioPrevisto: '12:30',
      horarioFim: '14:00',
      duracaoMin: 90,
      custoCentavos: 9500,
      observacoes: 'Reservar mesa para o horário do almoço.',
      fotoUrl: 'https://picsum.photos/seed/cafe-colonial/900/700',
      lat: -29.3741,
      lng: -50.8747,
      geoStatus: 'confirmado',
    },
  });

  const passagem = await prisma.passagem.create({
    data: {
      viagemId: viagem.id,
      tipo: 'AVIAO',
      origem: 'São Paulo (GRU)',
      destino: 'Porto Alegre (POA)',
      partida: '2026-05-12T08:20:00Z',
      chegada: '2026-05-12T10:05:00Z',
      companhia: 'Exemplo Air',
      localizador: 'EXEMPLO-GRUPOA',
      valorCentavos: 78000,
      moeda: 'BRL',
      importadoDe: 'manual',
    },
  });

  const hotel = await prisma.hotel.create({
    data: {
      viagemId: viagem.id,
      nome: 'Hotel Vila Verde',
      endereco: 'Av. Borges de Medeiros, 2000',
      cidade: 'Gramado',
      checkin: '2026-05-12T14:00:00Z',
      checkout: '2026-05-15T12:00:00Z',
      valorNoiteCentavos: 48000,
      noites: 3,
      valorTotalCentavos: 144000,
      codigoReserva: 'EXEMPLO-4837',
      fotoUrl: 'https://picsum.photos/seed/hotel-serra/900/700',
      lat: -29.3765,
      lng: -50.8742,
      geoStatus: 'confirmado',
    },
  });

  await prisma.roteiro.createMany({
    data: [
      {
        viagemId: viagem.id,
        diaId: dias[0].id,
        tipoItem: 'HOTEL',
        itemId: hotel.id,
        ordem: 0,
      },
      {
        viagemId: viagem.id,
        diaId: dias[0].id,
        tipoItem: 'LOCAL',
        itemId: lagoNegro.id,
        ordem: 1,
        inicio: '10:30',
        fim: '12:00',
      },
      {
        viagemId: viagem.id,
        diaId: dias[0].id,
        tipoItem: 'LOCAL',
        itemId: cafe.id,
        ordem: 2,
        inicio: '12:30',
        fim: '14:00',
      },
      {
        viagemId: viagem.id,
        diaId: dias[0].id,
        tipoItem: 'PASSAGEM',
        itemId: passagem.id,
        ordem: 3,
        inicio: '08:20',
        fim: '10:05',
      },
      {
        viagemId: viagem.id,
        diaId: dias[1].id,
        tipoItem: 'HOTEL',
        itemId: hotel.id,
        ordem: 0,
      },
      {
        viagemId: viagem.id,
        diaId: dias[2].id,
        tipoItem: 'HOTEL',
        itemId: hotel.id,
        ordem: 0,
      },
    ],
  });

  const documentos = await prisma.lista.create({
    data: {
      usuarioId: usuario.id,
      viagemId: viagem.id,
      nome: 'Documentos da viagem',
      categoria: 'Documentos',
    },
  });
  await prisma.listaItem.createMany({
    data: [
      { listaId: documentos.id, nome: 'Passaporte', tipo: 'documento', ordem: 0 },
      { listaId: documentos.id, nome: 'Seguro viagem', tipo: 'documento', ordem: 1 },
      {
        listaId: documentos.id,
        nome: 'Cartão de embarque',
        tipo: 'documento',
        ordem: 2,
        concluido: true,
        concluidoEm: new Date('2026-05-01T10:00:00Z'),
      },
    ],
  });

  console.log('Seed aplicado.');
  console.log(`Login: ${EMAIL_DEMO} / ${SENHA_DEMO}`);
}

main()
  .catch((erro: unknown) => {
    console.error('Falha ao aplicar o seed:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
