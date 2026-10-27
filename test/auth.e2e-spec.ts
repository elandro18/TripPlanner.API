import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { USUARIOS_REPOSITORY } from '../src/modules/usuarios/usuarios.repository';
import { InMemoryUsuariosRepository } from './support/in-memory-usuarios.repository';
import { prepararBancoDeTeste } from './support/prisma-de-teste';

process.env.JWT_SECRET = 'segredo-de-testes-e2e-nao-usar-em-producao';
process.env.BCRYPT_SALT_ROUNDS = '4';

const BASE = '/api/v1';

const ELANDRO = { nome: 'Elandro', email: 'elandro@exemplo.com', senha: 'senha-segura' };
const MARIA = { nome: 'Maria', email: 'maria@exemplo.com', senha: 'outra-senha' };

describe('Autenticação (e2e) — RN-001 a RN-004', () => {
  let app: INestApplication;
  const repositorio = new InMemoryUsuariosRepository();

  beforeAll(async () => {
    prepararBancoDeTeste();
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(USUARIOS_REPOSITORY)
      .useValue(repositorio)
      .compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const servidor = () => request(app.getHttpServer());

  const registrar = (dados: typeof ELANDRO) => servidor().post(`${BASE}/auth/registrar`).send(dados);

  describe('POST /auth/registrar', () => {
    it('RN-001: cria a conta com dados válidos e devolve token (201)', async () => {
      const resposta = await registrar(ELANDRO).expect(201);

      expect(resposta.body).toMatchObject({
        id: expect.any(Number),
        nome: ELANDRO.nome,
        email: ELANDRO.email,
        token: expect.any(String),
      });
      expect(resposta.body.token.split('.')).toHaveLength(3); // JWT
      expect(resposta.body).not.toHaveProperty('senhaHash');
      expect(resposta.body).not.toHaveProperty('senha');
    });

    it('RN-001: persiste a senha como hash, nunca em texto puro', async () => {
      const usuario = repositorio.todos.find((item) => item.email === ELANDRO.email);

      expect(usuario?.senhaHash).toBeDefined();
      expect(usuario?.senhaHash).not.toBe(ELANDRO.senha);
      expect(usuario?.senhaHash).toMatch(/^\$2[aby]\$/);
    });

    it('RN-001: recusa e-mail já cadastrado com ERR-040 (409)', async () => {
      const resposta = await registrar(ELANDRO).expect(409);

      expect(resposta.body).toEqual([
        { id: 'ERR-040', message: 'E-mail já cadastrado', field: 'email', detail: null },
      ]);
    });

    it('RN-001: recusa campos obrigatórios ausentes com ERR-002/003/005 (400)', async () => {
      const resposta = await registrar({ nome: '', email: '', senha: '' }).expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-002', message: 'Nome é obrigatório', field: 'nome', detail: null },
        { id: 'ERR-003', message: 'E-mail é obrigatório', field: 'email', detail: null },
        { id: 'ERR-005', message: 'Senha é obrigatória', field: 'senha', detail: null },
      ]);
    });

    it('RN-001: recusa e-mail em formato inválido com ERR-004 (400)', async () => {
      const resposta = await registrar({ nome: 'João', email: 'joao-sem-arroba', senha: 'senha-segura' }).expect(400);

      expect(resposta.body).toEqual([
        { id: 'ERR-004', message: 'Formato de e-mail inválido', field: 'email', detail: null },
      ]);
    });
  });

  describe('POST /auth/login', () => {
    it('RN-002: autentica com credenciais corretas (200)', async () => {
      const resposta = await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: ELANDRO.email, senha: ELANDRO.senha })
        .expect(200);

      expect(resposta.body).toMatchObject({
        id: expect.any(Number),
        nome: ELANDRO.nome,
        email: ELANDRO.email,
        token: expect.any(String),
      });
    });

    it('RN-002: autentica com e-mail em caixa alta (normalização)', async () => {
      await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: ELANDRO.email.toUpperCase(), senha: ELANDRO.senha })
        .expect(200);
    });

    it('RN-002: recusa senha incorreta com ERR-030 (401)', async () => {
      const resposta = await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: ELANDRO.email, senha: 'senha-errada' })
        .expect(401);

      expect(resposta.body).toEqual([
        { id: 'ERR-030', message: 'Credenciais inválidas (e-mail ou senha)', field: null, detail: null },
      ]);
    });

    it('RN-002: recusa e-mail inexistente com ERR-030 (401, sem revelar cadastro)', async () => {
      await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: 'ninguem@exemplo.com', senha: 'senha-segura' })
        .expect(401)
        .expect((resposta) => {
          expect(resposta.body[0].id).toBe('ERR-030');
        });
    });

    it('RN-002: exige e-mail e senha (400)', async () => {
      const resposta = await servidor().post(`${BASE}/auth/login`).send({}).expect(400);

      expect(resposta.body.map((item: { id: string }) => item.id)).toEqual(['ERR-003', 'ERR-005']);
    });
  });

  describe('GET /auth/me', () => {
    let tokenElandro: string;
    let tokenMaria: string;

    beforeAll(async () => {
      const respostaMaria = await registrar(MARIA).expect(201);
      tokenMaria = respostaMaria.body.token;
      const respostaLogin = await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: ELANDRO.email, senha: ELANDRO.senha })
        .expect(200);
      tokenElandro = respostaLogin.body.token;
    });

    it('RN-004: devolve os dados do dono do token (200)', async () => {
      const resposta = await servidor()
        .get(`${BASE}/auth/me`)
        .set('Authorization', `Bearer ${tokenElandro}`)
        .expect(200);

      expect(resposta.body).toEqual({
        id: expect.any(Number),
        nome: ELANDRO.nome,
        email: ELANDRO.email,
        ativo: true,
      });
    });

    it('RN-004: cada usuário recebe apenas a própria identidade', async () => {
      const elandro = await servidor().get(`${BASE}/auth/me`).set('Authorization', `Bearer ${tokenElandro}`).expect(200);
      const maria = await servidor().get(`${BASE}/auth/me`).set('Authorization', `Bearer ${tokenMaria}`).expect(200);

      expect(elandro.body.email).toBe(ELANDRO.email);
      expect(maria.body.email).toBe(MARIA.email);
      expect(elandro.body.id).not.toBe(maria.body.id);
    });

    it('RN-002/RN-003: recusa sem token com ERR-031 (401)', async () => {
      const resposta = await servidor().get(`${BASE}/auth/me`).expect(401);

      expect(resposta.body).toEqual([
        { id: 'ERR-031', message: 'Token ausente ou inválido', field: null, detail: null },
      ]);
    });

    it('RN-002: recusa token malformado com ERR-031 (401)', async () => {
      await servidor().get(`${BASE}/auth/me`).set('Authorization', 'Bearer nao-e-um-jwt').expect(401);
    });

    it('RN-002: recusa token sem o prefixo Bearer com ERR-031 (401)', async () => {
      await servidor().get(`${BASE}/auth/me`).set('Authorization', tokenElandro).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('RN-003: encerra a sessão e o token deixa de ser aceito (204 → 401)', async () => {
      const sessao = await servidor()
        .post(`${BASE}/auth/login`)
        .send({ email: ELANDRO.email, senha: ELANDRO.senha })
        .expect(200);
      const token: string = sessao.body.token;

      await servidor().get(`${BASE}/auth/me`).set('Authorization', `Bearer ${token}`).expect(200);
      await servidor().post(`${BASE}/auth/logout`).set('Authorization', `Bearer ${token}`).expect(204);
      await servidor().get(`${BASE}/auth/me`).set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('RN-003: o logout de um token não invalida a sessão de outro', async () => {
      const primeiro = await servidor().post(`${BASE}/auth/login`).send({ email: ELANDRO.email, senha: ELANDRO.senha });
      const segundo = await servidor().post(`${BASE}/auth/login`).send({ email: ELANDRO.email, senha: ELANDRO.senha });

      await servidor()
        .post(`${BASE}/auth/logout`)
        .set('Authorization', `Bearer ${primeiro.body.token}`)
        .expect(204);

      await servidor().get(`${BASE}/auth/me`).set('Authorization', `Bearer ${segundo.body.token}`).expect(200);
    });

    it('RN-003: exige autenticação para encerrar a sessão (401)', async () => {
      await servidor().post(`${BASE}/auth/logout`).expect(401);
    });
  });

  describe('Envelope de erro (convenções gerais)', () => {
    it('devolve o erro em array também para rota inexistente', async () => {
      const resposta = await servidor().get(`${BASE}/rota-inexistente`).expect(404);

      expect(Array.isArray(resposta.body)).toBe(true);
      expect(resposta.body[0]).toHaveProperty('id');
      expect(resposta.body[0]).toHaveProperty('message');
      expect(resposta.body[0]).toHaveProperty('field');
      expect(resposta.body[0]).toHaveProperty('detail');
    });
  });
});
