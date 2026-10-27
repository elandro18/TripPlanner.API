import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { PrismaService } from '../src/persistencia/prisma/prisma.service';
import { prismaDeTeste, prepararBancoDeTeste } from './support/prisma-de-teste';

process.env.JWT_SECRET = 'segredo-de-testes-e2e-nao-usar-em-producao';
process.env.BCRYPT_SALT_ROUNDS = '4';

const BASE = '/api/v1';

interface Contexto {
  readonly id: number;
  readonly token: string;
  readonly viagemId: number;
  readonly dias: Array<{ id: number; numeroDia: number; data: string | null }>;
}

/** Destinos, dias, roteiro e listas pela API (SQLite real). */
describe('Destinos, dias, roteiro e listas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let contador = 0;

  beforeAll(async () => {
    prepararBancoDeTeste();
    prisma = await prismaDeTeste();
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
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
    const email = `contexto${++contador}@exemplo.com`;
    const resposta = await servidor()
      .post(`${BASE}/auth/registrar`)
      .send({ nome: `Usuário ${contador}`, email, senha: 'senha-segura' })
      .expect(201);
    return { id: resposta.body.id, token: resposta.body.token };
  }

  async function criarViagem(
    token: string,
    corpo: Record<string, unknown> = {
      nome: 'Férias RS',
      destino: 'Gramado',
      dataInicio: '2026-12-20',
      dataFim: '2026-12-23',
    },
  ): Promise<number> {
    const resposta = await servidor()
      .post(`${BASE}/viagens`)
      .set(autorizado(token))
      .send(corpo)
      .expect(201);
    return resposta.body.id;
  }

  async function criarContexto(): Promise<Contexto> {
    const usuario = await criarUsuario();
    const viagemId = await criarViagem(usuario.token);
    const dias = await servidor()
      .get(`${BASE}/viagens/${viagemId}/dias`)
      .set(autorizado(usuario.token))
      .expect(200);
    return { ...usuario, viagemId, dias: dias.body };
  }

  describe('Destinos', () => {
    it('cria, lista, edita, reordena e exclui destinos', async () => {
      const { token, viagemId, dias } = await criarContexto();

      const gramado = await servidor()
        .post(`${BASE}/viagens/${viagemId}/destinos`)
        .set(autorizado(token))
        .send({ nome: 'Gramado', cidade: 'Gramado', lat: -29.3785, lng: -50.8727 })
        .expect(201);
      expect(gramado.body).toMatchObject({ viagemId, ordem: 0, pais: null });

      const canela = await servidor()
        .post(`${BASE}/viagens/${viagemId}/destinos`)
        .set(autorizado(token))
        .send({ nome: 'Canela', cidade: 'Canela' })
        .expect(201);
      expect(canela.body.ordem).toBe(1);

      const lista = await servidor()
        .get(`${BASE}/viagens/${viagemId}/destinos`)
        .set(autorizado(token))
        .expect(200);
      expect(lista.body.map((destino: { nome: string }) => destino.nome)).toEqual([
        'Gramado',
        'Canela',
      ]);

      const editado = await servidor()
        .put(`${BASE}/destinos/${gramado.body.id}`)
        .set(autorizado(token))
        .send({ nome: 'Gramado Centro', cidade: 'Gramado', lat: -29.3785, lng: -50.8727 })
        .expect(200);
      expect(editado.body).toMatchObject({ nome: 'Gramado Centro', ordem: 0 });

      const reordenados = await servidor()
        .put(`${BASE}/viagens/${viagemId}/destinos/reordenar`)
        .set(autorizado(token))
        .send({ ids: [canela.body.id, gramado.body.id] })
        .expect(200);
      expect(reordenados.body.map((destino: { id: number }) => destino.id)).toEqual([
        canela.body.id,
        gramado.body.id,
      ]);

      const dia = await servidor()
        .put(`${BASE}/dias/${dias[0].id}`)
        .set(autorizado(token))
        .send({ destinoId: gramado.body.id })
        .expect(200);
      expect(dia.body.destinoId).toBe(gramado.body.id);

      await servidor()
        .delete(`${BASE}/destinos/${gramado.body.id}`)
        .set(autorizado(token))
        .expect(204);

      const diaApos = await servidor()
        .get(`${BASE}/dias/${dias[0].id}`)
        .set(autorizado(token))
        .expect(200);
      expect(diaApos.body.destinoId).toBeNull();
    });

    it('isola destinos por dono da viagem (403)', async () => {
      const dono = await criarContexto();
      const intruso = await criarUsuario();

      await servidor()
        .get(`${BASE}/viagens/${dono.viagemId}/destinos`)
        .set(autorizado(intruso.token))
        .expect(403);
    });
  });

  describe('Dias', () => {
    it('adiciona dia extra e estende o período da viagem', async () => {
      const { token, viagemId } = await criarContexto();

      const novo = await servidor()
        .post(`${BASE}/viagens/${viagemId}/dias`)
        .set(autorizado(token))
        .send({})
        .expect(201);

      expect(novo.body).toMatchObject({ numeroDia: 5, data: '2026-12-24' });

      const viagem = await servidor()
        .get(`${BASE}/viagens/${viagemId}`)
        .set(autorizado(token))
        .expect(200);
      expect(viagem.body.dataFim).toBe('2026-12-24');
    });

    it('edita título e exclui um dia renumerando as datas', async () => {
      const { token, viagemId, dias } = await criarContexto();

      const editado = await servidor()
        .put(`${BASE}/dias/${dias[0].id}`)
        .set(autorizado(token))
        .send({ titulo: 'Chegada' })
        .expect(200);
      expect(editado.body.titulo).toBe('Chegada');

      await servidor()
        .delete(`${BASE}/dias/${dias[1].id}`)
        .set(autorizado(token))
        .expect(204);

      const restantes = await servidor()
        .get(`${BASE}/viagens/${viagemId}/dias`)
        .set(autorizado(token))
        .expect(200);

      expect(restantes.body.map((dia: { numeroDia: number; data: string }) => [dia.numeroDia, dia.data])).toEqual([
        [1, '2026-12-20'],
        [2, '2026-12-21'],
        [3, '2026-12-22'],
      ]);
    });

    it('cria dias sem data em viagem sem período', async () => {
      const { token } = await criarUsuario();
      const viagemId = await criarViagem(token, {
        nome: 'Sem datas',
        destino: 'Florianópolis',
        comDatas: false,
      });

      const novo = await servidor()
        .post(`${BASE}/viagens/${viagemId}/dias`)
        .set(autorizado(token))
        .send({ titulo: 'Dia livre' })
        .expect(201);

      expect(novo.body).toMatchObject({ numeroDia: 2, data: null, titulo: 'Dia livre' });
    });
  });

  describe('Roteiro', () => {
    async function contextoComItens() {
      const contexto = await criarContexto();

      const local = await servidor()
        .post(`${BASE}/viagens/${contexto.viagemId}/locais`)
        .set(autorizado(contexto.token))
        .send({
          nome: 'Lago Negro',
          horarioPrevisto: '10:00',
          duracaoEstimada: 90,
          custo: 25,
        })
        .expect(201);

      const passagem = await servidor()
        .post(`${BASE}/viagens/${contexto.viagemId}/passagens`)
        .set(autorizado(contexto.token))
        .send({
          tipo: 'aviao',
          origem: 'POA',
          destino: 'GRU',
          dataHoraPartida: '2026-12-20T14:00:00Z',
          dataHoraChegada: '2026-12-20T16:00:00Z',
          valor: 850,
        })
        .expect(201);

      const hotel = await servidor()
        .post(`${BASE}/viagens/${contexto.viagemId}/hoteis`)
        .set(autorizado(contexto.token))
        .send({
          nome: 'Hotel Serra',
          dataHoraCheckin: '2026-12-20T15:00:00Z',
          dataHoraCheckout: '2026-12-23T11:00:00Z',
          valorTotal: 900,
        })
        .expect(201);

      return { ...contexto, local: local.body, passagem: passagem.body, hotel: hotel.body };
    }

    it('cria cards com horário natural, evita duplicidade e conflito', async () => {
      const { token, viagemId, dias, local, passagem, hotel } = await contextoComItens();

      const cardLocal = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'LOCAL', itemId: local.id })
        .expect(201);
      expect(cardLocal.body).toMatchObject({
        tipo: 'LOCAL',
        horarioInicio: '10:00',
        horarioFim: '11:30',
        ordem: 0,
        concluido: false,
      });

      const duplicado = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'LOCAL', itemId: local.id })
        .expect(409);
      expect(duplicado.body[0].id).toBe('ERR-042');

      const conflito = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({
          tipo: 'PASSAGEM',
          itemId: passagem.id,
          horarioInicio: '11:00',
          horarioFim: '12:00',
        })
        .expect(422);
      expect(conflito.body[0].id).toBe('ERR-050');

      const cardPassagem = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'PASSAGEM', itemId: passagem.id })
        .expect(201);
      expect(cardPassagem.body).toMatchObject({
        horarioInicio: '14:00',
        horarioFim: '16:00',
      });

      const cardHotel = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'HOTEL', itemId: hotel.id })
        .expect(201);
      expect(cardHotel.body).toMatchObject({ horarioInicio: null, horarioFim: null });

      const roteiro = await servidor()
        .get(`${BASE}/viagens/${viagemId}/roteiro`)
        .set(autorizado(token))
        .expect(200);
      expect(roteiro.body).toHaveLength(3);
    });

    it('conclui, move entre dias, reordena e exclui cards', async () => {
      const { token, viagemId, dias, local, passagem } = await contextoComItens();

      const cardLocal = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'LOCAL', itemId: local.id })
        .expect(201);
      const cardPassagem = await servidor()
        .post(`${BASE}/dias/${dias[0].id}/roteiro`)
        .set(autorizado(token))
        .send({ tipo: 'PASSAGEM', itemId: passagem.id })
        .expect(201);

      const concluido = await servidor()
        .put(`${BASE}/roteiro/${cardLocal.body.id}`)
        .set(autorizado(token))
        .send({ concluido: true })
        .expect(200);
      expect(concluido.body.concluido).toBe(true);

      const movido = await servidor()
        .put(`${BASE}/roteiro/${cardLocal.body.id}`)
        .set(autorizado(token))
        .send({ diaId: dias[1].id })
        .expect(200);
      expect(movido.body.diaId).toBe(dias[1].id);

      const reordenado = await servidor()
        .put(`${BASE}/dias/${dias[0].id}/roteiro/reordenar`)
        .set(autorizado(token))
        .send({ ordens: [{ id: cardPassagem.body.id, ordem: 0 }] })
        .expect(200);
      expect(reordenado.body[0]).toMatchObject({ id: cardPassagem.body.id, ordem: 0 });

      await servidor()
        .delete(`${BASE}/roteiro/${cardPassagem.body.id}`)
        .set(autorizado(token))
        .expect(204);

      const restante = await servidor()
        .get(`${BASE}/viagens/${viagemId}/roteiro`)
        .set(autorizado(token))
        .expect(200);
      expect(restante.body.map((card: { id: number }) => card.id)).toEqual([cardLocal.body.id]);
    });

    it('recusa item de outra viagem (ERR-043)', async () => {
      const primeira = await contextoComItens();
      const local = await servidor()
        .post(`${BASE}/viagens/${primeira.viagemId}/locais`)
        .set(autorizado(primeira.token))
        .send({ nome: 'Local da primeira' })
        .expect(201);

      const segunda = await criarContexto();
      const resposta = await servidor()
        .post(`${BASE}/dias/${segunda.dias[0].id}/roteiro`)
        .set(autorizado(segunda.token))
        .send({ tipo: 'LOCAL', itemId: local.body.id })
        .expect(422);

      expect(resposta.body[0].id).toBe('ERR-043');
    });
  });

  describe('Listas', () => {
    it('cria lista e itens, conclui, reordena e exclui em cascata', async () => {
      const { token, viagemId } = await criarContexto();

      const lista = await servidor()
        .post(`${BASE}/listas`)
        .set(autorizado(token))
        .send({ nome: 'Documentos', categoria: 'Documentos', viagemId })
        .expect(201);
      expect(lista.body).toMatchObject({ viagemId, categoria: 'Documentos' });

      const passaporte = await servidor()
        .post(`${BASE}/listas/${lista.body.id}/itens`)
        .set(autorizado(token))
        .send({ nome: 'Passaporte', tipo: 'documento' })
        .expect(201);
      expect(passaporte.body).toMatchObject({ ordem: 0, concluido: false, valor: null });

      const seguro = await servidor()
        .post(`${BASE}/listas/${lista.body.id}/itens`)
        .set(autorizado(token))
        .send({ nome: 'Seguro viagem', valorPrevisto: 120.5 })
        .expect(201);
      expect(seguro.body.valorPrevisto).toBe(120.5);

      const itens = await servidor()
        .get(`${BASE}/listas/${lista.body.id}/itens`)
        .set(autorizado(token))
        .expect(200);
      expect(itens.body.map((item: { nome: string }) => item.nome)).toEqual([
        'Passaporte',
        'Seguro viagem',
      ]);

      const concluido = await servidor()
        .put(`${BASE}/itens/${passaporte.body.id}`)
        .set(autorizado(token))
        .send({ concluido: true, valorPago: 50, pagoEm: '2026-12-01T10:00:00Z' })
        .expect(200);
      expect(concluido.body).toMatchObject({ concluido: true, valorPago: 50 });
      expect(concluido.body.concluidoEm).toEqual(expect.any(String));

      const reordenado = await servidor()
        .put(`${BASE}/listas/${lista.body.id}/itens/reordenar`)
        .set(autorizado(token))
        .send({ ordens: [{ id: seguro.body.id, ordem: 0 }] })
        .expect(200);
      expect(reordenado.body[0].id).toBe(seguro.body.id);

      await servidor()
        .delete(`${BASE}/listas/${lista.body.id}`)
        .set(autorizado(token))
        .expect(204);

      const itensApos = await prisma.listaItem.count({ where: { listaId: lista.body.id } });
      expect(itensApos).toBe(0);
    });

    it('isola listas por usuário (404)', async () => {
      const dono = await criarContexto();
      const outro = await criarUsuario();
      const lista = await servidor()
        .post(`${BASE}/listas`)
        .set(autorizado(dono.token))
        .send({ nome: 'Minha lista', viagemId: dono.viagemId })
        .expect(201);

      await servidor()
        .get(`${BASE}/listas/${lista.body.id}`)
        .set(autorizado(outro.token))
        .expect(404);
    });
  });

  describe('Resumo', () => {
    it('consolida contagens, progresso e orçamento', async () => {
      const { token, viagemId, dias } = await criarContexto();

      const local = await servidor()
        .post(`${BASE}/viagens/${viagemId}/locais`)
        .set(autorizado(token))
        .send({ nome: 'Museu', custo: 30 })
        .expect(201);
      const passagem = await servidor()
        .post(`${BASE}/viagens/${viagemId}/passagens`)
        .set(autorizado(token))
        .send({
          tipo: 'onibus',
          origem: 'POA',
          destino: 'Gramado',
          dataHoraPartida: '2026-12-20T08:00:00Z',
          valor: 100,
        })
        .expect(201);
      const hotel = await servidor()
        .post(`${BASE}/viagens/${viagemId}/hoteis`)
        .set(autorizado(token))
        .send({
          nome: 'Pousada',
          dataHoraCheckin: '2026-12-20T15:00:00Z',
          dataHoraCheckout: '2026-12-23T11:00:00Z',
          valorTotal: 200,
        })
        .expect(201);

      for (const [tipo, itemId] of [
        ['LOCAL', local.body.id],
        ['PASSAGEM', passagem.body.id],
        ['HOTEL', hotel.body.id],
      ] as const) {
        await servidor()
          .post(`${BASE}/dias/${dias[0].id}/roteiro`)
          .set(autorizado(token))
          .send({ tipo, itemId })
          .expect(201);
      }

      const resumo = await servidor()
        .get(`${BASE}/viagens/${viagemId}/resumo`)
        .set(autorizado(token))
        .expect(200);

      expect(resumo.body).toEqual({
        dias: 4,
        locais: 1,
        passagens: 1,
        hoteis: 1,
        totalItens: 3,
        itensOrganizados: 3,
        progresso: 100,
        orcamento: { locais: 30, passagens: 100, hoteis: 200, total: 330 },
      });
    });
  });
});
