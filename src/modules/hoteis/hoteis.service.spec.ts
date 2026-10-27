import {
  AcessoNegadoError,
  CheckoutAnteriorCheckinError,
  HotelNaoEncontradoError,
} from '../../common/errors/dominio.error';
import { criarModuloDeDominio, REPOSITORIOS_PRISMA } from '../../../test/support/modulo-de-teste';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { CriarHotelDto } from './dto/hotel.dto';
import { HoteisService } from './hoteis.service';

const USUARIO_A = 1;
const USUARIO_B = 2;
const VIAGEM_ID = 1;

const HOTEL: CriarHotelDto = {
  nome: 'Hotel Bavária',
  endereco: 'Rua das Hortênsias, 100',
  cidade: 'Gramado',
  dataHoraCheckin: '2026-12-20T15:00:00Z',
  dataHoraCheckout: '2026-12-27T11:00:00Z',
  valorNoite: 300,
  noites: 7,
  reserva: 'BV-8899',
};

/** RN-016 a RN-018 sobre os repositórios Prisma reais (SQLite temporário). */
describe('HoteisService (RN-016, RN-017, RN-018)', () => {
  let servico: HoteisService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const contexto = await criarModuloDeDominio([...REPOSITORIOS_PRISMA, HoteisService]);
    prisma = contexto.prisma;
    servico = contexto.modulo.get(HoteisService);

    await prisma.usuario.create({
      data: { id: USUARIO_A, nome: 'Elandro', email: 'elandro@exemplo.com', senhaHash: 'hash' },
    });
    await prisma.usuario.create({
      data: { id: USUARIO_B, nome: 'Maria', email: 'maria@exemplo.com', senhaHash: 'hash' },
    });
    await prisma.viagem.create({
      data: {
        id: VIAGEM_ID,
        usuarioId: USUARIO_A,
        nome: 'Férias RS',
        destino: 'Gramado',
        dataInicio: '2026-12-20',
        dataFim: '2026-12-27',
        ativa: true,
      },
    });
  });

  describe('criar (RN-016, RN-017)', () => {
    it('registra o hotel no banco', async () => {
      const hotel = await servico.criar(VIAGEM_ID, HOTEL, USUARIO_A);

      expect(hotel).toMatchObject({
        id: 1,
        viagemId: VIAGEM_ID,
        nome: 'Hotel Bavária',
        endereco: 'Rua das Hortênsias, 100',
        cidade: 'Gramado',
        dataHoraCheckin: '2026-12-20T15:00:00Z',
        dataHoraCheckout: '2026-12-27T11:00:00Z',
        valorNoite: 300,
        noites: 7,
        valorTotal: 2100,
        reserva: 'BV-8899',
        fotoUrl: null,
        lat: null,
        lng: null,
        geoStatus: null,
      });

      const persistido = await prisma.hotel.findUnique({ where: { id: hotel.id } });
      expect(persistido).toMatchObject({
        viagemId: VIAGEM_ID,
        nome: 'Hotel Bavária',
        checkin: '2026-12-20T15:00:00Z',
        checkout: '2026-12-27T11:00:00Z',
        valorNoiteCentavos: 30000,
        valorTotalCentavos: 210000,
        codigoReserva: 'BV-8899',
      });
    });

    it('RN-017: calcula o valor total como valorNoite × noites', async () => {
      const hotel = await servico.criar(VIAGEM_ID, { ...HOTEL, valorNoite: 300, noites: 7 }, USUARIO_A);

      expect(hotel.valorTotal).toBe(2100);
    });

    it('RN-017: arredonda o valor calculado para duas casas', async () => {
      const hotel = await servico.criar(VIAGEM_ID, { ...HOTEL, valorNoite: 199.99, noites: 3 }, USUARIO_A);

      expect(hotel.valorTotal).toBe(599.97);
    });

    it('RN-017: mantém o valor total informado manualmente', async () => {
      const hotel = await servico.criar(VIAGEM_ID, { ...HOTEL, valorTotal: 1950 }, USUARIO_A);

      expect(hotel.valorTotal).toBe(1950);
    });

    it('RN-016: aceita hospedagem sem valores (valorTotal nulo)', async () => {
      const { valorNoite, noites, ...semValores } = HOTEL;

      const hotel = await servico.criar(VIAGEM_ID, semValores, USUARIO_A);

      expect(hotel).toMatchObject({ valorNoite: null, noites: null, valorTotal: null });
    });

    it('RN-016/ERR-012: recusa check-out anterior ao check-in', async () => {
      const invalido = { ...HOTEL, dataHoraCheckout: '2026-12-19T11:00:00Z' };

      await expect(servico.criar(VIAGEM_ID, invalido, USUARIO_A)).rejects.toBeInstanceOf(
        CheckoutAnteriorCheckinError,
      );
      await expect(servico.criar(VIAGEM_ID, invalido, USUARIO_A)).rejects.toMatchObject({
        codigo: 'ERR-012',
      });
      expect(await prisma.hotel.count()).toBe(0);
    });

    it('aceita campos opcionais ausentes', async () => {
      const hotel = await servico.criar(
        VIAGEM_ID,
        {
          nome: 'Pousada',
          dataHoraCheckin: '2026-12-20T15:00:00',
          dataHoraCheckout: '2026-12-21T11:00:00',
          valorTotal: 0,
        },
        USUARIO_A,
      );

      expect(hotel).toMatchObject({
        endereco: null,
        cidade: null,
        valorNoite: null,
        noites: null,
        valorTotal: 0,
        reserva: null,
      });
    });
  });

  describe('buscar/atualizar/excluir (RN-018)', () => {
    it('consulta e atualiza o hotel', async () => {
      const hotel = await servico.criar(VIAGEM_ID, HOTEL, USUARIO_A);

      await expect(servico.buscar(hotel.id, USUARIO_A)).resolves.toMatchObject({
        id: hotel.id,
        nome: 'Hotel Bavária',
      });

      const atualizado = await servico.atualizar(
        hotel.id,
        { ...HOTEL, nome: 'Hotel Serra', valorNoite: 250, noites: 7 },
        USUARIO_A,
      );
      expect(atualizado).toMatchObject({ id: hotel.id, nome: 'Hotel Serra', valorTotal: 1750 });
    });

    it('RN-018: exclui o hotel e os cards vinculados a ele', async () => {
      const hotel = await servico.criar(VIAGEM_ID, HOTEL, USUARIO_A);
      const dia = await prisma.dia.create({
        data: { viagemId: VIAGEM_ID, numero: 1, data: '2026-12-20' },
      });
      await prisma.roteiro.create({
        data: {
          viagemId: VIAGEM_ID,
          diaId: dia.id,
          tipoItem: 'HOTEL',
          itemId: hotel.id,
          ordem: 1,
        },
      });

      await servico.excluir(hotel.id, USUARIO_A);

      expect(await prisma.hotel.count()).toBe(0);
      expect(await prisma.roteiro.count()).toBe(0);
      await expect(servico.buscar(hotel.id, USUARIO_A)).rejects.toBeInstanceOf(
        HotelNaoEncontradoError,
      );
    });

    it('recusa hotel inexistente com ERR-064', async () => {
      await expect(servico.buscar(999, USUARIO_A)).rejects.toMatchObject({ codigo: 'ERR-064' });
      await expect(servico.excluir(999, USUARIO_A)).rejects.toMatchObject({ codigo: 'ERR-064' });
    });

    it('RN-004: recusa acesso ao hotel de outro usuário com ERR-032', async () => {
      const hotel = await servico.criar(VIAGEM_ID, HOTEL, USUARIO_A);

      await expect(servico.buscar(hotel.id, USUARIO_B)).rejects.toBeInstanceOf(AcessoNegadoError);
      await expect(servico.atualizar(hotel.id, HOTEL, USUARIO_B)).rejects.toMatchObject({
        codigo: 'ERR-032',
      });
      await expect(servico.excluir(hotel.id, USUARIO_B)).rejects.toMatchObject({
        codigo: 'ERR-032',
      });
      expect(await prisma.hotel.count()).toBe(1);
    });
  });
});
