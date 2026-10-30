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

const VIAGEM = {
  nome: 'Férias RS',
  destino: 'Gramado',
  dataInicio: '2026-12-20',
  dataFim: '2026-12-23',
};

/**
 * Viagens e Dias pela API (RN-004 a RN-009, RN-034), com os repositórios ACL
 * reais sobre uma planilha em memória.
 */
describe('Viagens e Dias (e2e) — RN-004 a RN-009, RN-034', () => {
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

  async function criarUsuario(nome = 'Usuário'): Promise<{ id: number; token: string }> {
    const email = `usuario${++contador}@exemplo.com`;
    const resposta = await servidor()
      .post(`${BASE}/auth/registrar`)
      .send({ nome, email, senha: 'senha-segura' })
      .expect(201);
    return { id: resposta.body.id, token: resposta.body.token };
  }

  const autorizado = (token: string) => ({ Authorization: `Bearer ${token}` });

  function criarViagem(token: string, corpo: Record<string, unknown> = VIAGEM) {
    return servidor().post(`${BASE}/viagens`).set(autorizado(token)).send(corpo);
  }

  describe('POST /viagens (RN-005, RN-006, RN-034)', () => {
    it('RN-005: cria a viagem com a moeda Real e devolve 201', async () => {
      const usuario = await criarUsuario('Elandro');

      const resposta = await criarViagem(usuario.token).expect(201);

      expect(resposta.body).toEqual({
        id: expect.any(Number),
        nome: 'Férias RS',
        destino: 'Gramado',
        comDatas: true,
        dataInicio: '2026-12-20',
        dataFim: '2026-12-23',
        moeda: 'BRL',
        ativa: true,
        capaUrl: '',
        criadaEm: expect.any(String),
      });
      expect(resposta.body).not.toHaveProperty('usuarioId');
    });

    it('RN-034/RN-009: gera os dias do período como colunas em ordem cronológica', async () => {
      const usuario = await criarUsuario();
      const viagem = await criarViagem(usuario.token).expect(201);

      const resposta = await servidor()
        .get(`${BASE}/viagens/${viagem.body.id}/dias`)
        .set(autorizado(usuario.token))
        .expect(200);

      expect(resposta.body.map((dia: { numeroDia: number; data: string }) => [dia.numeroDia, dia.data])).toEqual([
        [1, '2026-12-20'],
        [2, '2026-12-21'],
        [3, '2026-12-22'],
        [4, '2026-12-23'],
      ]);
    });

    it('RN-005: recusa data de fim anterior ao início com ERR-007 (400)', async () => {
      const usuario = await criarUsuario();

      const resposta = await criarViagem(usuario.token, { ...VIAGEM, dataFim: '2026-12-01' }).expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-007', message: 'Data de fim deve ser maior ou igual à data de início', field: 'dataFim', detail: null },
      ]);
    });

    it('RN-005: recusa campos obrigatórios ausentes (ERR-002/008/006/007)', async () => {
      const usuario = await criarUsuario();

      const resposta = await criarViagem(usuario.token, {}).expect(400);

      expect(resposta.body.map((erro: { id: string }) => erro.id)).toEqual([
        'ERR-002',
        'ERR-008',
        'ERR-006',
        'ERR-007',
      ]);
    });

    it('RN-006: uma nova viagem ativa desativa a anterior (201)', async () => {
      const usuario = await criarUsuario();
      const primeira = await criarViagem(usuario.token).expect(201);

      const segunda = await criarViagem(usuario.token).expect(201);

      expect(segunda.body.ativa).toBe(true);
      const lista = await servidor()
        .get(`${BASE}/viagens`)
        .set(autorizado(usuario.token))
        .expect(200);
      const anterior = lista.body.content.find(
        (viagem: { id: number }) => viagem.id === primeira.body.id,
      );
      expect(anterior.ativa).toBe(false);
    });

    it('cria viagem sem datas com um dia sem data (comDatas=false)', async () => {
      const usuario = await criarUsuario();

      const viagem = await criarViagem(usuario.token, {
        nome: 'Sem datas',
        destino: 'Florianópolis',
        comDatas: false,
      }).expect(201);

      expect(viagem.body).toMatchObject({
        comDatas: false,
        dataInicio: null,
        dataFim: null,
        ativa: true,
      });

      const dias = await servidor()
        .get(`${BASE}/viagens/${viagem.body.id}/dias`)
        .set(autorizado(usuario.token))
        .expect(200);
      expect(dias.body).toEqual([
        expect.objectContaining({ numeroDia: 1, data: null, destinoId: null }),
      ]);
    });

    it('exige autenticação (ERR-031, 401)', async () => {
      const resposta = await servidor().post(`${BASE}/viagens`).send(VIAGEM).expect(401);

      expect(resposta.body).toEqual([
        { id: 'ERR-031', message: 'Token ausente ou inválido', field: null, detail: null },
      ]);
    });
  });

  describe('GET /viagens (RN-004)', () => {
    it('devolve o envelope de paginação offset com apenas as viagens do usuário', async () => {
      const usuario = await criarUsuario();
      await criarViagem(usuario.token).expect(201);
      const outro = await criarUsuario();
      await criarViagem(outro.token).expect(201);

      const resposta = await servidor().get(`${BASE}/viagens`).set(autorizado(usuario.token)).expect(200);

      expect(resposta.body).toMatchObject({ page: 0, size: 20, totalElements: 1, totalPages: 1 });
      expect(resposta.body.content).toHaveLength(1);
      expect(resposta.body.content[0]).toMatchObject({ nome: 'Férias RS', ativa: true });
    });

    it('pagina as viagens do usuário (page/size)', async () => {
      const usuario = await criarUsuario();
      await criarViagem(usuario.token).expect(201);
      await prisma.viagem.createMany({
        data: [
          {
            usuarioId: usuario.id,
            nome: 'Viagem antiga',
            destino: 'POA',
            dataInicio: '2025-01-01',
            dataFim: '2025-01-05',
            ativa: false,
          },
          {
            usuarioId: usuario.id,
            nome: 'Viagem futura',
            destino: 'Chile',
            dataInicio: '2027-01-01',
            dataFim: '2027-01-05',
            ativa: false,
          },
        ],
      });

      const primeira = await servidor()
        .get(`${BASE}/viagens?page=0&size=2`)
        .set(autorizado(usuario.token))
        .expect(200);
      expect(primeira.body).toMatchObject({ totalElements: 3, totalPages: 2 });
      expect(primeira.body.content).toHaveLength(2);

      const segunda = await servidor().get(`${BASE}/viagens?page=1&size=2`).set(autorizado(usuario.token)).expect(200);
      expect(segunda.body.content).toHaveLength(1);
    });

    it('recusa paginação inválida com ERR-016 (400)', async () => {
      const usuario = await criarUsuario();

      const resposta = await servidor()
        .get(`${BASE}/viagens?page=abc`)
        .set(autorizado(usuario.token))
        .expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-016', message: 'Parâmetro de paginação inválido', field: 'page', detail: null },
      ]);
    });
  });

  describe('GET /viagens/{id} (RN-004)', () => {
    it('devolve a viagem do próprio usuário', async () => {
      const usuario = await criarUsuario();
      const viagem = await criarViagem(usuario.token).expect(201);

      const resposta = await servidor()
        .get(`${BASE}/viagens/${viagem.body.id}`)
        .set(autorizado(usuario.token))
        .expect(200);

      expect(resposta.body).toMatchObject({ id: viagem.body.id, nome: 'Férias RS' });
    });

    it('RN-004: nega acesso à viagem de outro usuário com ERR-032 (403)', async () => {
      const dono = await criarUsuario();
      const viagem = await criarViagem(dono.token).expect(201);
      const intruso = await criarUsuario();

      const resposta = await servidor()
        .get(`${BASE}/viagens/${viagem.body.id}`)
        .set(autorizado(intruso.token))
        .expect(403);

      expect(resposta.body).toEqual([
        { id: 'ERR-032', message: 'Acesso negado a recurso de outro usuário', field: null, detail: null },
      ]);
    });

    it('RN-004: a listagem do intruso continua vazia', async () => {
      const dono = await criarUsuario();
      await criarViagem(dono.token).expect(201);
      const intruso = await criarUsuario();

      const resposta = await servidor().get(`${BASE}/viagens`).set(autorizado(intruso.token)).expect(200);

      expect(resposta.body).toMatchObject({ totalElements: 0 });
      expect(resposta.body.content).toEqual([]);
    });

    it('devolve ERR-060 (404) para viagem inexistente ou id não numérico', async () => {
      const usuario = await criarUsuario();

      await servidor().get(`${BASE}/viagens/999999`).set(autorizado(usuario.token)).expect(404);
      const resposta = await servidor().get(`${BASE}/viagens/abc`).set(autorizado(usuario.token)).expect(404);

      expect(resposta.body).toEqual([
        { id: 'ERR-060', message: 'Viagem não encontrada', field: 'id', detail: null },
      ]);
    });
  });

  describe('PUT /viagens/{id} (RN-007, RN-034)', () => {
    it('grava as alterações e regenera os dias quando o período muda', async () => {
      const usuario = await criarUsuario();
      const viagem = await criarViagem(usuario.token).expect(201);

      const resposta = await servidor()
        .put(`${BASE}/viagens/${viagem.body.id}`)
        .set(autorizado(usuario.token))
        .send({ ...VIAGEM, nome: 'Férias RS 2027', dataFim: '2026-12-21' })
        .expect(200);

      expect(resposta.body).toMatchObject({ nome: 'Férias RS 2027', dataFim: '2026-12-21' });

      const dias = await servidor()
        .get(`${BASE}/viagens/${viagem.body.id}/dias`)
        .set(autorizado(usuario.token))
        .expect(200);
      expect(dias.body.map((dia: { data: string }) => dia.data)).toEqual(['2026-12-20', '2026-12-21']);
    });

    it('RN-004: nega a edição da viagem de outro usuário (403)', async () => {
      const dono = await criarUsuario();
      const viagem = await criarViagem(dono.token).expect(201);
      const intruso = await criarUsuario();

      await servidor()
        .put(`${BASE}/viagens/${viagem.body.id}`)
        .set(autorizado(intruso.token))
        .send(VIAGEM)
        .expect(403);
    });
  });

  describe('DELETE /viagens/{id} (RN-007)', () => {
    it('exclui a viagem, os dias e os itens vinculados (204 → 404)', async () => {
      const usuario = await criarUsuario();
      const viagem = await criarViagem(usuario.token).expect(201);
      const viagemId = viagem.body.id;

      await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(usuario.token))
        .send({ nome: 'Lago Negro', custo: 0 })
        .expect(201);

      await servidor().delete(`${BASE}/viagens/${viagemId}`).set(autorizado(usuario.token)).expect(204);
      await servidor().get(`${BASE}/viagens/${viagemId}`).set(autorizado(usuario.token)).expect(404);

      expect(await prisma.viagem.count({ where: { id: viagemId } })).toBe(0);
      expect(await prisma.dia.count({ where: { viagemId } })).toBe(0);
      expect(await prisma.local.count({ where: { viagemId } })).toBe(0);
    });

    it('RN-004: nega a exclusão da viagem de outro usuário (403)', async () => {
      const dono = await criarUsuario();
      const viagem = await criarViagem(dono.token).expect(201);
      const intruso = await criarUsuario();

      await servidor().delete(`${BASE}/viagens/${viagem.body.id}`).set(autorizado(intruso.token)).expect(403);
    });
  });

  describe('GET /viagens/{viagemId}/dias (RN-004, RN-008)', () => {
    it('nega a leitura dos dias de viagem de outro usuário (403)', async () => {
      const dono = await criarUsuario();
      const viagem = await criarViagem(dono.token).expect(201);
      const intruso = await criarUsuario();

      await servidor().get(`${BASE}/viagens/${viagem.body.id}/dias`).set(autorizado(intruso.token)).expect(403);
    });

    it('devolve ERR-060 (404) para viagem inexistente', async () => {
      const usuario = await criarUsuario();

      await servidor().get(`${BASE}/viagens/999999/dias`).set(autorizado(usuario.token)).expect(404);
    });
  });
});
