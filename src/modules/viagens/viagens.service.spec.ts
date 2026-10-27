import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import {
  AcessoNegadoError,
  DataFimInvalidaError,
  ViagemNaoEncontradaError,
} from '../../common/errors/dominio.error';
import { criarModuloDeDominio, REPOSITORIOS_PRISMA } from '../../../test/support/modulo-de-teste';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DiasService } from './dias.service';
import { CriarViagemDto } from './dto/viagem.dto';
import { ViagensService } from './viagens.service';

const USUARIO_A = 1;
const USUARIO_B = 2;

const VIAGEM: CriarViagemDto = {
  nome: 'Férias RS',
  destino: 'Gramado',
  dataInicio: '2026-12-20',
  dataFim: '2026-12-23',
};

const paginacao = (page = 0, size = 20): PaginacaoQueryDto => ({ page, size });

/**
 * Integração do serviço com os repositórios Prisma reais em SQLite —
 * RN-005 a RN-009, RN-034 e isolamento por dono (RN-004).
 */
describe('ViagensService / DiasService (RN-004 a RN-009, RN-034)', () => {
  let servico: ViagensService;
  let dias: DiasService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const contexto = await criarModuloDeDominio([
      ...REPOSITORIOS_PRISMA,
      ViagensService,
      DiasService,
    ]);
    prisma = contexto.prisma;
    servico = contexto.modulo.get(ViagensService);
    dias = contexto.modulo.get(DiasService);

    await prisma.usuario.create({
      data: { id: USUARIO_A, nome: 'Elandro', email: 'elandro@exemplo.com', senhaHash: 'hash' },
    });
    await prisma.usuario.create({
      data: { id: USUARIO_B, nome: 'Maria', email: 'maria@exemplo.com', senhaHash: 'hash' },
    });
  });

  describe('criar (RN-005, RN-006, RN-034)', () => {
    it('registra nome, destino, período e moeda Real, com a viagem ativa', async () => {
      await expect(servico.criar(VIAGEM, USUARIO_A)).resolves.toMatchObject({
        id: 1,
        nome: 'Férias RS',
        destino: 'Gramado',
        comDatas: true,
        dataInicio: '2026-12-20',
        dataFim: '2026-12-23',
        moeda: 'BRL',
        ativa: true,
        capaUrl: '',
      });

      const persistidas = await prisma.viagem.findMany();
      expect(persistidas).toHaveLength(1);
      expect(persistidas[0]).toMatchObject({
        usuarioId: USUARIO_A,
        nome: 'Férias RS',
        destino: 'Gramado',
        dataInicio: '2026-12-20',
        dataFim: '2026-12-23',
      });
    });

    it('RN-034: gera um dia por data do período, numerados em ordem cronológica (RN-009)', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);

      const gerados = await dias.listarPorViagem(viagem.id, USUARIO_A);

      expect(gerados.map((dia) => [dia.numeroDia, dia.data])).toEqual([
        [1, '2026-12-20'],
        [2, '2026-12-21'],
        [3, '2026-12-22'],
        [4, '2026-12-23'],
      ]);
      expect(await prisma.dia.count()).toBe(4);
    });

    it('RN-034: período de um único dia gera uma coluna', async () => {
      const viagem = await servico.criar({ ...VIAGEM, dataFim: '2026-12-20' }, USUARIO_A);

      await expect(dias.listarPorViagem(viagem.id, USUARIO_A)).resolves.toHaveLength(1);
    });

    it('RN-005: recusa período com fim anterior ao início (ERR-007)', async () => {
      await expect(
        servico.criar({ ...VIAGEM, dataFim: '2026-12-19' }, USUARIO_A),
      ).rejects.toBeInstanceOf(DataFimInvalidaError);
      await expect(
        servico.criar({ ...VIAGEM, dataFim: '2026-12-19' }, USUARIO_A),
      ).rejects.toMatchObject({ codigo: 'ERR-007', campo: 'dataFim' });
      expect(await prisma.viagem.count()).toBe(0);
    });

    it('RN-006: uma nova viagem ativa desativa a anterior do mesmo usuário', async () => {
      const primeira = await servico.criar(VIAGEM, USUARIO_A);
      const segunda = await servico.criar({ ...VIAGEM, nome: 'Nova' }, USUARIO_A);

      expect(segunda).toMatchObject({ ativa: true, nome: 'Nova' });
      expect(await prisma.viagem.count({ where: { usuarioId: USUARIO_A, ativa: true } })).toBe(1);
      expect(await prisma.viagem.findUnique({ where: { id: primeira.id } })).toMatchObject({
        ativa: false,
      });
    });

    it('RN-006: permite alternar a viagem ativa pelo endpoint', async () => {
      const primeira = await servico.criar(VIAGEM, USUARIO_A);
      const segunda = await servico.criar({ ...VIAGEM, nome: 'Nova' }, USUARIO_A);

      const ativada = await servico.ativar(primeira.id, USUARIO_A);

      expect(ativada).toMatchObject({ id: primeira.id, ativa: true });
      expect(await prisma.viagem.findUnique({ where: { id: segunda.id } })).toMatchObject({
        ativa: false,
      });
    });

    it('RN-006: a viagem ativa de um usuário não bloqueia outro usuário', async () => {
      await servico.criar(VIAGEM, USUARIO_A);

      await expect(servico.criar(VIAGEM, USUARIO_B)).resolves.toMatchObject({
        id: 2,
        ativa: true,
      });
    });

    it('RN-006: após excluir a viagem ativa é possível criar outra', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);
      await servico.excluir(viagem.id, USUARIO_A);

      await expect(servico.criar(VIAGEM, USUARIO_A)).resolves.toMatchObject({ ativa: true });
    });
  });

  describe('atualizar (RN-007, RN-034)', () => {
    it('grava as alterações dos dados da viagem', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);

      const atualizada = await servico.atualizar(
        viagem.id,
        { ...VIAGEM, nome: 'Férias RS 2027', destino: 'Canela' },
        USUARIO_A,
      );

      expect(atualizada).toMatchObject({
        id: viagem.id,
        nome: 'Férias RS 2027',
        destino: 'Canela',
        ativa: true,
      });
    });

    it('RN-034: encurtar o período remove os dias excedentes e seus cards', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);
      const antes = await dias.listarPorViagem(viagem.id, USUARIO_A);

      await prisma.roteiro.create({
        data: {
          viagemId: viagem.id,
          diaId: antes[2].id,
          tipoItem: 'LOCAL',
          itemId: 99,
          ordem: 1,
          inicio: '10:00',
          fim: '11:00',
        },
      });

      await servico.atualizar(viagem.id, { ...VIAGEM, dataFim: '2026-12-21' }, USUARIO_A);

      const depois = await dias.listarPorViagem(viagem.id, USUARIO_A);
      expect(depois.map((dia) => dia.data)).toEqual(['2026-12-20', '2026-12-21']);
      expect(depois.map((dia) => dia.id)).toEqual([antes[0].id, antes[1].id]);
      expect(await prisma.roteiro.count()).toBe(0);
    });

    it('RN-034: ampliar o período acrescenta os dias que faltam', async () => {
      const viagem = await servico.criar({ ...VIAGEM, dataFim: '2026-12-21' }, USUARIO_A);

      await servico.atualizar(viagem.id, { ...VIAGEM, dataFim: '2026-12-24' }, USUARIO_A);

      const depois = await dias.listarPorViagem(viagem.id, USUARIO_A);
      expect(depois.map((dia) => dia.data)).toEqual([
        '2026-12-20',
        '2026-12-21',
        '2026-12-22',
        '2026-12-23',
        '2026-12-24',
      ]);
    });

    it('RN-034/RN-009: renumerar os dias quando a data de início muda', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);
      const antes = await dias.listarPorViagem(viagem.id, USUARIO_A);

      await servico.atualizar(viagem.id, { ...VIAGEM, dataInicio: '2026-12-21' }, USUARIO_A);

      const depois = await dias.listarPorViagem(viagem.id, USUARIO_A);
      expect(depois.map((dia) => [dia.numeroDia, dia.data])).toEqual([
        [1, '2026-12-21'],
        [2, '2026-12-22'],
        [3, '2026-12-23'],
      ]);
      expect(depois.map((dia) => dia.id)).toEqual([antes[1].id, antes[2].id, antes[3].id]);
    });

    it('RN-005: recusa período inválido na edição', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);

      await expect(
        servico.atualizar(viagem.id, { ...VIAGEM, dataFim: '2026-12-01' }, USUARIO_A),
      ).rejects.toMatchObject({ codigo: 'ERR-007' });
    });
  });

  describe('excluir (RN-007)', () => {
    it('remove a viagem e os dados vinculados (dias, itens e cards)', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);
      const [primeiroDia] = await dias.listarPorViagem(viagem.id, USUARIO_A);

      const local = await prisma.local.create({
        data: { viagemId: viagem.id, nome: 'Lago Negro' },
      });
      await prisma.passagem.create({
        data: {
          viagemId: viagem.id,
          tipo: 'AVIAO',
          origem: 'POA',
          destino: 'GRU',
          partida: '2026-12-20T14:30:00Z',
          chegada: '2026-12-20T16:10:00Z',
          companhia: 'Gol',
          localizador: 'ABC123',
          valorCentavos: 85000,
        },
      });
      await prisma.hotel.create({
        data: {
          viagemId: viagem.id,
          nome: 'Hotel Bavária',
          endereco: 'Rua Y',
          cidade: 'Gramado',
          checkin: '2026-12-20T15:00:00Z',
          checkout: '2026-12-23T11:00:00Z',
          valorNoiteCentavos: 30000,
          noites: 3,
          valorTotalCentavos: 90000,
          codigoReserva: 'BV-1',
        },
      });
      await prisma.roteiro.create({
        data: {
          viagemId: viagem.id,
          diaId: primeiroDia.id,
          tipoItem: 'LOCAL',
          itemId: local.id,
          ordem: 1,
          inicio: '10:00',
          fim: '11:00',
        },
      });

      await servico.excluir(viagem.id, USUARIO_A);

      expect(await prisma.viagem.count()).toBe(0);
      expect(await prisma.dia.count()).toBe(0);
      expect(await prisma.local.count()).toBe(0);
      expect(await prisma.passagem.count()).toBe(0);
      expect(await prisma.hotel.count()).toBe(0);
      expect(await prisma.roteiro.count()).toBe(0);
    });
  });

  describe('isolamento por dono (RN-004)', () => {
    it('recusa acesso à viagem de outro usuário com ERR-032', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);

      await expect(servico.buscar(viagem.id, USUARIO_B)).rejects.toBeInstanceOf(
        AcessoNegadoError,
      );
      await expect(servico.atualizar(viagem.id, VIAGEM, USUARIO_B)).rejects.toMatchObject({
        codigo: 'ERR-032',
      });
      await expect(servico.excluir(viagem.id, USUARIO_B)).rejects.toMatchObject({
        codigo: 'ERR-032',
      });
      await expect(dias.listarPorViagem(viagem.id, USUARIO_B)).rejects.toMatchObject({
        codigo: 'ERR-032',
      });
      expect(await prisma.viagem.count()).toBe(1);
    });

    it('recusa viagem inexistente com ERR-060', async () => {
      await expect(servico.buscar(999, USUARIO_A)).rejects.toBeInstanceOf(
        ViagemNaoEncontradaError,
      );
      await expect(dias.listarPorViagem(999, USUARIO_A)).rejects.toMatchObject({
        codigo: 'ERR-060',
      });
    });

    it('lista apenas as viagens do próprio usuário, com paginação offset', async () => {
      await servico.criar(VIAGEM, USUARIO_A);
      await prisma.viagem.createMany({
        data: [
          {
            usuarioId: USUARIO_A,
            nome: 'Viagem antiga',
            destino: 'POA',
            dataInicio: '2025-01-01',
            dataFim: '2025-01-05',
            ativa: false,
          },
          {
            usuarioId: USUARIO_A,
            nome: 'Viagem futura',
            destino: 'Chile',
            dataInicio: '2027-01-01',
            dataFim: '2027-01-05',
            ativa: false,
          },
          {
            usuarioId: USUARIO_B,
            nome: 'Viagem do B',
            destino: 'Salvador',
            dataInicio: '2026-01-01',
            dataFim: '2026-01-03',
            ativa: true,
          },
        ],
      });

      const primeira = await servico.listar(USUARIO_A, paginacao(0, 2));
      expect(primeira).toMatchObject({ page: 0, size: 2, totalElements: 3, totalPages: 2 });
      expect(primeira.content.map((viagem) => viagem.id)).toEqual([1, 2]);

      const segunda = await servico.listar(USUARIO_A, paginacao(1, 2));
      expect(segunda.content.map((viagem) => viagem.id)).toEqual([3]);

      const doB = await servico.listar(USUARIO_B, paginacao());
      expect(doB.content.map((viagem) => viagem.id)).toEqual([4]);
      expect(doB.totalElements).toBe(1);
    });

    it('não expõe o dono da viagem na resposta', async () => {
      const viagem = await servico.criar(VIAGEM, USUARIO_A);

      expect(viagem).not.toHaveProperty('usuarioId');
    });
  });
});
