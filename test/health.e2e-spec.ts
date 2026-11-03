import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { PrismaService } from '../src/persistencia/prisma/prisma.service';
import { prismaDeTeste } from './support/prisma-de-teste';

process.env.JWT_SECRET = 'segredo-de-testes-e2e-nao-usar-em-producao';
process.env.BCRYPT_SALT_ROUNDS = '4';

const BASE = '/api/v1';

describe('Health (e2e) — GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prisma = await prismaDeTeste();
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

  it('responde 200 com a API e o banco saudáveis, sem exigir autenticação', async () => {
    const resposta = await servidor().get(`${BASE}/health`).expect(200);

    expect(resposta.body).toMatchObject({
      status: 'ok',
      aplicacao: 'TripPlanner.API',
      ambiente: 'test',
      banco: { status: 'ok', descricao: expect.any(String) },
    });
    expect(typeof resposta.body.banco.latenciaMs).toBe('number');
    expect(typeof resposta.body.uptimeSegundos).toBe('number');
  });

  it('responde 503 quando o banco falha, mantendo o corpo descritivo', async () => {
    const prisma = app.get(PrismaService);
    const spy = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('banco fora'));

    try {
      const resposta = await servidor().get(`${BASE}/health`).expect(503);

      expect(resposta.body).toMatchObject({
        status: 'degradado',
        banco: { status: 'erro', latenciaMs: null },
      });
    } finally {
      spy.mockRestore();
    }
  });
});
