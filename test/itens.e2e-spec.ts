import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { prismaDeTeste } from './support/prisma-de-teste';
import { PrismaService } from '../src/persistencia/prisma/prisma.service';

process.env.JWT_SECRET = 'segredo-de-testes-e2e-nao-usar-em-producao';
process.env.BCRYPT_SALT_ROUNDS = '4';

const BASE = '/api/v1';

/**
 * Locais, Passagens e Hotéis pela API (RN-010 a RN-018), com os repositórios
 * ACL reais sobre uma planilha em memória.
 */
describe('Itens da viagem (e2e) — RN-010 a RN-018', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let contador = 0;

  beforeAll(async () => {
    prisma = await prismaDeTeste();
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const servidor = () => request(app.getHttpServer());
  const autorizado = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function criarUsuario(): Promise<{ id: number; token: string }> {
    const email = `item${++contador}@exemplo.com`;
    const resposta = await servidor()
      .post(`${BASE}/auth/registrar`)
      .send({ nome: `Usuário ${contador}`, email, senha: 'senha-segura' })
      .expect(201);
    return { id: resposta.body.id, token: resposta.body.token };
  }

  /** Usuário com uma viagem ativa (contexto dos itens). */
  async function criarContexto(): Promise<{ id: number; token: string; viagemId: number }> {
    const usuario = await criarUsuario();
    const viagem = await servidor()
      .post(`${BASE}/viagens`)
      .set(autorizado(usuario.token))
      .send({ nome: 'Férias RS', destino: 'Gramado', dataInicio: '2026-12-20', dataFim: '2026-12-23' })
      .expect(201);
    return { ...usuario, viagemId: viagem.body.id };
  }

  /** Primeiro dia da viagem — usado para criar cards diretamente no banco. */
  async function primeiroDiaId(viagemId: number): Promise<number> {
    const dia = await prisma.dia.findFirst({
      where: { viagemId },
      orderBy: { numero: 'asc' },
    });
    if (!dia) {
      throw new Error(`Viagem ${viagemId} sem dias`);
    }
    return dia.id;
  }

  describe('Locais (RN-010, RN-011, RN-012)', () => {
    it('RN-010: cadastra o local e o devolve na listagem (Backlog)', async () => {
      const { token, viagemId } = await criarContexto();

      const criado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({
          nome: 'Lago Negro',
          endereco: 'Av. Borges de Medeiros',
          cidade: 'Gramado',
          categoria: 'atração',
          horarioPrevisto: '10:00',
          duracaoEstimada: 90,
          custo: 0,
          observacoes: 'Passeio de pedalinho',
        })
        .expect(201);

      expect(criado.body).toMatchObject({
        id: expect.any(Number),
        viagemId,
        nome: 'Lago Negro',
        endereco: 'Av. Borges de Medeiros',
        cidade: 'Gramado',
        categoria: 'atração',
        horarioPrevisto: '10:00',
        duracaoEstimada: 90,
        custo: 0,
        observacoes: 'Passeio de pedalinho',
      });

      const listagem = await servidor()
        .get(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .expect(200);
      expect(listagem.body).toMatchObject({ page: 0, size: 20, totalElements: 1, totalPages: 1 });
      expect(listagem.body.content[0]).toMatchObject({ id: criado.body.id, nome: 'Lago Negro' });
    });

    it('RN-012: aceita local gratuito (custo zero) e sem custo informado', async () => {
      const { token, viagemId } = await criarContexto();

      const gratuito = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Parque', custo: 0 })
        .expect(201);
      expect(gratuito.body.custo).toBe(0);

      const semCusto = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Praça' })
        .expect(201);
      expect(semCusto.body.custo).toBeNull();
    });

    it('RN-010: exige o nome (ERR-002) e recusa custo negativo (ERR-011)', async () => {
      const { token, viagemId } = await criarContexto();

      const semNome = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ custo: 10 })
        .expect(400);
      expect(semNome.body).toEqual([
        { id: 'ERR-002', message: 'Nome é obrigatório', field: 'nome', detail: null },
      ]);

      const negativo = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Museu', custo: -1 })
        .expect(400);
      expect(negativo.body).toEqual([
        { id: 'ERR-011', message: 'Valor não pode ser negativo', field: 'custo', detail: null },
      ]);
    });

    it('RN-011: consulta, edita e exclui o local (204 → 404)', async () => {
      const { token, viagemId } = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Lago Negro', custo: 0 })
        .expect(201);

      const consultado = await servidor()
        .get(`${BASE}/locais/${criado.body.id}`)
        .set(autorizado(token))
        .expect(200);
      expect(consultado.body).toMatchObject({ nome: 'Lago Negro' });

      const editado = await servidor()
        .put(`${BASE}/locais/${criado.body.id}`)
        .set(autorizado(token))
        .send({ nome: 'Lago Negro', cidade: 'Gramado', custo: 25.5 })
        .expect(200);
      expect(editado.body).toMatchObject({ cidade: 'Gramado', custo: 25.5 });

      await servidor().delete(`${BASE}/locais/${criado.body.id}`).set(autorizado(token)).expect(204);
      const resposta = await servidor().get(`${BASE}/locais/${criado.body.id}`).set(autorizado(token)).expect(404);
      expect(resposta.body).toEqual([
        { id: 'ERR-062', message: 'Local não encontrado', field: 'id', detail: null },
      ]);
    });

    it('RN-011: excluir o local remove os cards vinculados a ele', async () => {
      const { token, viagemId } = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Museu' })
        .expect(201);
      const diaId = await primeiroDiaId(viagemId);
      await prisma.roteiro.createMany({
        data: [
          {
            viagemId,
            diaId,
            tipoItem: 'LOCAL',
            itemId: criado.body.id,
            ordem: 1,
            inicio: '10:00',
            fim: '11:00',
          },
          {
            viagemId,
            diaId,
            tipoItem: 'LOCAL',
            itemId: 999,
            ordem: 2,
            inicio: '11:00',
            fim: '12:00',
          },
        ],
      });

      await servidor().delete(`${BASE}/locais/${criado.body.id}`).set(autorizado(token)).expect(204);

      expect(
        await prisma.roteiro.count({ where: { tipoItem: 'LOCAL', itemId: criado.body.id } }),
      ).toBe(0);
      expect(await prisma.roteiro.count({ where: { tipoItem: 'LOCAL', itemId: 999 } })).toBe(1);
    });

    it('pagina os locais da viagem (offset)', async () => {
      const { token, viagemId } = await criarContexto();
      for (const nome of ['A', 'B', 'C']) {
        await servidor()
          .post(`${BASE}/viagens/${viagemId}/locais`)
          .set(autorizado(token))
          .send({ nome: `Local ${nome}` })
          .expect(201);
      }

      const primeira = await servidor()
        .get(`${BASE}/viagens/${viagemId}/locais?page=0&size=2`)
        .set(autorizado(token))
        .expect(200);
      expect(primeira.body).toMatchObject({ totalElements: 3, totalPages: 2, size: 2 });
      expect(primeira.body.content).toHaveLength(2);

      const segunda = await servidor()
        .get(`${BASE}/viagens/${viagemId}/locais?page=1&size=2`)
        .set(autorizado(token))
        .expect(200);
      expect(segunda.body.content).toHaveLength(1);
    });

    it('RN-004: nega acesso ao local de outro usuário (403)', async () => {
      const dono = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${dono.viagemId}/locais`)
        .set(autorizado(dono.token))
        .send({ nome: 'Museu' })
        .expect(201);
      const intruso = await criarUsuario();

      await servidor().get(`${BASE}/locais/${criado.body.id}`).set(autorizado(intruso.token)).expect(403);
      await servidor()
        .put(`${BASE}/locais/${criado.body.id}`)
        .set(autorizado(intruso.token))
        .send({ nome: 'Invadido' })
        .expect(403);
      await servidor().delete(`${BASE}/locais/${criado.body.id}`).set(autorizado(intruso.token)).expect(403);
      await servidor().get(`${BASE}/viagens/${dono.viagemId}/locais`).set(autorizado(intruso.token)).expect(403);
    });

    it('devolve ERR-062 (404) para local inexistente', async () => {
      const { token } = await criarContexto();

      await servidor().get(`${BASE}/locais/999999`).set(autorizado(token)).expect(404);
      await servidor().get(`${BASE}/locais/xyz`).set(autorizado(token)).expect(404);
    });
  });

  describe('Passagens (RN-013, RN-014, RN-015)', () => {
    const PASSAGEM = {
      tipo: 'AVIAO',
      origem: 'POA',
      destino: 'GRU',
      dataHoraPartida: '2026-12-20T14:30:00Z',
      dataHoraChegada: '2026-12-20T16:10:00Z',
      companhia: 'Gol',
      localizador: 'ABC123',
      valor: 850,
    };

    it('RN-013: cadastra a passagem com todos os campos', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send(PASSAGEM)
        .expect(201);

      expect(resposta.body).toMatchObject({ id: expect.any(Number), viagemId, ...PASSAGEM });
    });

    it('RN-014: aceita os três tipos e recusa tipo fora da lista com ERR-009', async () => {
      const { token, viagemId } = await criarContexto();

      for (const tipo of ['AVIAO', 'TREM', 'ONIBUS']) {
        await servidor()
          .post(`${BASE}/viagens/${viagemId}/passagens`)
          .set(autorizado(token))
          .send({ ...PASSAGEM, tipo })
          .expect(201);
      }

      const invalido = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send({ ...PASSAGEM, tipo: 'NAVIO' })
        .expect(400);
      expect(invalido.body).toEqual([
        {
          id: 'ERR-009',
          message: 'Tipo de passagem inválido (use AVIAO, TREM ou ONIBUS)',
          field: 'tipo',
          detail: null,
        },
      ]);
    });

    it('RN-013: recusa chegada anterior à partida com ERR-010', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send({ ...PASSAGEM, dataHoraChegada: '2026-12-20T13:00:00Z' })
        .expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-010', message: 'Chegada deve ser maior ou igual à partida', field: 'dataHoraChegada', detail: null },
      ]);
    });

    it('RN-013: recusa valor negativo com ERR-011', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send({ ...PASSAGEM, valor: -10 })
        .expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-011', message: 'Valor não pode ser negativo', field: 'valor', detail: null },
      ]);
    });

    it('RN-015: consulta, edita e exclui a passagem (204 → 404)', async () => {
      const { token, viagemId } = await criarContexto();
      const criada = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send(PASSAGEM)
        .expect(201);

      await servidor().get(`${BASE}/passagens/${criada.body.id}`).set(autorizado(token)).expect(200);
      const editada = await servidor()
        .put(`${BASE}/passagens/${criada.body.id}`)
        .set(autorizado(token))
        .send({ ...PASSAGEM, tipo: 'ONIBUS', valor: 120 })
        .expect(200);
      expect(editada.body).toMatchObject({ tipo: 'ONIBUS', valor: 120 });

      await servidor().delete(`${BASE}/passagens/${criada.body.id}`).set(autorizado(token)).expect(204);
      const resposta = await servidor().get(`${BASE}/passagens/${criada.body.id}`).set(autorizado(token)).expect(404);
      expect(resposta.body).toEqual([
        { id: 'ERR-063', message: 'Passagem não encontrada', field: 'id', detail: null },
      ]);
    });

    it('RN-015: excluir a passagem remove os cards vinculados', async () => {
      const { token, viagemId } = await criarContexto();
      const criada = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send(PASSAGEM)
        .expect(201);
      await prisma.roteiro.create({
        data: {
          viagemId,
          diaId: await primeiroDiaId(viagemId),
          tipoItem: 'PASSAGEM',
          itemId: criada.body.id,
          ordem: 1,
        },
      });

      await servidor().delete(`${BASE}/passagens/${criada.body.id}`).set(autorizado(token)).expect(204);

      expect(
        await prisma.roteiro.count({ where: { tipoItem: 'PASSAGEM', itemId: criada.body.id } }),
      ).toBe(0);
    });

    it('RN-004: nega acesso à passagem de outro usuário (403)', async () => {
      const dono = await criarContexto();
      const criada = await servidor()
        .post(`${BASE}/viagens/${dono.viagemId}/passagens`)
        .set(autorizado(dono.token))
        .send(PASSAGEM)
        .expect(201);
      const intruso = await criarUsuario();

      await servidor().get(`${BASE}/passagens/${criada.body.id}`).set(autorizado(intruso.token)).expect(403);
      await servidor().delete(`${BASE}/passagens/${criada.body.id}`).set(autorizado(intruso.token)).expect(403);
    });

    it('devolve ERR-063 (404) para passagem inexistente', async () => {
      const { token } = await criarContexto();

      await servidor().get(`${BASE}/passagens/999999`).set(autorizado(token)).expect(404);
    });
  });

  describe('Hotéis (RN-016, RN-017, RN-018)', () => {
    const HOTEL = {
      nome: 'Hotel Bavária',
      endereco: 'Rua das Hortênsias, 100',
      cidade: 'Gramado',
      dataHoraCheckin: '2026-12-20T15:00:00Z',
      dataHoraCheckout: '2026-12-27T11:00:00Z',
      reserva: 'BV-8899',
    };

    it('RN-016/RN-017: cadastra o hotel e calcula o valor total (noite × noites)', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({ ...HOTEL, valorNoite: 300, noites: 7 })
        .expect(201);

      expect(resposta.body).toMatchObject({ id: expect.any(Number), viagemId, ...HOTEL, valorNoite: 300, noites: 7, valorTotal: 2100 });
    });

    it('RN-017: mantém o valor total ajustado manualmente', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({ ...HOTEL, valorNoite: 300, noites: 7, valorTotal: 1950 })
        .expect(201);

      expect(resposta.body.valorTotal).toBe(1950);
    });

    it('RN-016: recusa check-out anterior ao check-in com ERR-012', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({ ...HOTEL, dataHoraCheckout: '2026-12-19T11:00:00Z', valorTotal: 100 })
        .expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-012', message: 'Check-out deve ser maior ou igual ao check-in', field: 'dataHoraCheckout', detail: null },
      ]);
    });

    it('RN-016: aceita hospedagem sem valores (valorTotal nulo)', async () => {
      const { token, viagemId } = await criarContexto();

      const resposta = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send(HOTEL)
        .expect(201);

      expect(resposta.body.valorTotal).toBeNull();
    });

    it('RN-018: consulta, edita e exclui o hotel (204 → 404)', async () => {
      const { token, viagemId } = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({ ...HOTEL, valorNoite: 300, noites: 7 })
        .expect(201);

      await servidor().get(`${BASE}/hoteis/${criado.body.id}`).set(autorizado(token)).expect(200);
      const editado = await servidor()
        .put(`${BASE}/hoteis/${criado.body.id}`)
        .set(autorizado(token))
        .send({ ...HOTEL, nome: 'Hotel Serra', valorNoite: 250, noites: 7 })
        .expect(200);
      expect(editado.body).toMatchObject({ nome: 'Hotel Serra', valorTotal: 1750 });

      await servidor().delete(`${BASE}/hoteis/${criado.body.id}`).set(autorizado(token)).expect(204);
      const resposta = await servidor().get(`${BASE}/hoteis/${criado.body.id}`).set(autorizado(token)).expect(404);
      expect(resposta.body).toEqual([
        { id: 'ERR-064', message: 'Hotel não encontrado', field: 'id', detail: null },
      ]);
    });

    it('RN-018: excluir o hotel remove os cards vinculados', async () => {
      const { token, viagemId } = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({ ...HOTEL, valorTotal: 100 })
        .expect(201);
      await prisma.roteiro.create({
        data: {
          viagemId,
          diaId: await primeiroDiaId(viagemId),
          tipoItem: 'HOTEL',
          itemId: criado.body.id,
          ordem: 1,
        },
      });

      await servidor().delete(`${BASE}/hoteis/${criado.body.id}`).set(autorizado(token)).expect(204);

      expect(
        await prisma.roteiro.count({ where: { tipoItem: 'HOTEL', itemId: criado.body.id } }),
      ).toBe(0);
    });

    it('RN-004: nega acesso ao hotel de outro usuário (403)', async () => {
      const dono = await criarContexto();
      const criado = await servidor()
        .post(`${BASE}/viagens/${dono.viagemId}/hoteis`)
        .set(autorizado(dono.token))
        .send({ ...HOTEL, valorTotal: 100 })
        .expect(201);
      const intruso = await criarUsuario();

      await servidor().get(`${BASE}/hoteis/${criado.body.id}`).set(autorizado(intruso.token)).expect(403);
      await servidor()
        .put(`${BASE}/hoteis/${criado.body.id}`)
        .set(autorizado(intruso.token))
        .send({ ...HOTEL, valorTotal: 1 })
        .expect(403);
    });

    it('devolve ERR-064 (404) para hotel inexistente', async () => {
      const { token } = await criarContexto();

      await servidor().get(`${BASE}/hoteis/999999`).set(autorizado(token)).expect(404);
    });
  });
});
