import { Test } from '@nestjs/testing';
import { JwtService, JwtModule } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { CredenciaisInvalidasError, EmailJaCadastradoError, TokenInvalidoError } from '../../common/errors/dominio.error';
import { USUARIOS_REPOSITORY } from '../usuarios/usuarios.repository';
import { InMemoryUsuariosRepository } from '../../../test/support/in-memory-usuarios.repository';
import { InMemoryTokenRevogadoRepository } from '../../../test/support/in-memory-token-revogado.repository';
import { criarConfigDeTeste } from '../../../test/support/config-de-teste';
import { AuthService } from './auth.service';
import { PayloadJwt } from './auth.types';
import { TokenRevocationService } from './token-revocation.service';
import { TOKEN_REVOGADO_REPOSITORY } from './token-revogado.repository';

const CONFIG: AppConfig = criarConfigDeTeste();

const ELANDRO = { nome: 'Elandro', email: 'Elandro@Exemplo.com', senha: 'senha-segura' };

describe('AuthService', () => {
  let servico: AuthService;
  let jwt: JwtService;
  let revogacao: TokenRevocationService;
  let repositorio: InMemoryUsuariosRepository;

  beforeEach(async () => {
    repositorio = new InMemoryUsuariosRepository();
    const modulo = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: CONFIG.jwt.secret,
          signOptions: { expiresIn: CONFIG.jwt.expiresIn },
        }),
      ],
      providers: [
        AuthService,
        TokenRevocationService,
        { provide: USUARIOS_REPOSITORY, useValue: repositorio },
        { provide: TOKEN_REVOGADO_REPOSITORY, useClass: InMemoryTokenRevogadoRepository },
        { provide: APP_CONFIG, useValue: CONFIG },
      ],
    }).compile();

    servico = modulo.get(AuthService);
    jwt = modulo.get(JwtService);
    revogacao = modulo.get(TokenRevocationService);
  });

  describe('registrar (RN-001)', () => {
    it('cria a conta e devolve sessão autenticada', async () => {
      const resposta = await servico.registrar(ELANDRO);

      expect(resposta).toMatchObject({ id: 1, nome: 'Elandro', email: 'elandro@exemplo.com' });
      const payload = await jwt.verifyAsync<PayloadJwt>(resposta.token);
      expect(Number(payload.sub)).toBe(1);
      expect(payload.jti).toBeDefined();
    });

    it('normaliza e-mail (trim/minúsculas) e nome (trim)', async () => {
      await servico.registrar({ nome: '  Elandro  ', email: '  ELANDRO@Exemplo.com ', senha: 'senha-segura' });

      expect(repositorio.todos[0]).toMatchObject({ nome: 'Elandro', email: 'elandro@exemplo.com' });
    });

    it('persiste o hash da senha, nunca o texto puro (SECURITY §3)', async () => {
      await servico.registrar(ELANDRO);

      const { senhaHash } = repositorio.todos[0];
      expect(senhaHash).not.toBe(ELANDRO.senha);
      expect(await bcrypt.compare(ELANDRO.senha, senhaHash)).toBe(true);
    });

    it('recusa e-mail já cadastrado com ERR-040', async () => {
      await servico.registrar(ELANDRO);

      await expect(servico.registrar(ELANDRO)).rejects.toBeInstanceOf(EmailJaCadastradoError);
      await expect(servico.registrar(ELANDRO)).rejects.toMatchObject({ codigo: 'ERR-040', campo: 'email' });
    });

    it('trata o e-mail original e o variante em caixa alta como o mesmo cadastro', async () => {
      await servico.registrar(ELANDRO);

      await expect(servico.registrar({ ...ELANDRO, email: 'ELANDRO@EXEMPLO.COM' })).rejects.toBeInstanceOf(
        EmailJaCadastradoError,
      );
    });
  });

  describe('login (RN-002)', () => {
    beforeEach(async () => {
      await servico.registrar(ELANDRO);
    });

    it('autentica com credenciais corretas', async () => {
      const resposta = await servico.login({ email: ELANDRO.email, senha: ELANDRO.senha });

      expect(resposta.token).toEqual(expect.any(String));
      expect(resposta.email).toBe('elandro@exemplo.com');
    });

    it('emite um jti distinto por sessão', async () => {
      const primeira = await servico.login({ email: ELANDRO.email, senha: ELANDRO.senha });
      const segunda = await servico.login({ email: ELANDRO.email, senha: ELANDRO.senha });

      const payloadA = await jwt.verifyAsync<PayloadJwt>(primeira.token);
      const payloadB = await jwt.verifyAsync<PayloadJwt>(segunda.token);
      expect(payloadA.jti).not.toBe(payloadB.jti);
    });

    it('recusa senha incorreta com ERR-030', async () => {
      await expect(servico.login({ email: ELANDRO.email, senha: 'errada' })).rejects.toBeInstanceOf(CredenciaisInvalidasError);
      await expect(servico.login({ email: ELANDRO.email, senha: 'errada' })).rejects.toMatchObject({ codigo: 'ERR-030' });
    });

    it('recusa e-mail inexistente com ERR-030', async () => {
      await expect(servico.login({ email: 'ninguem@exemplo.com', senha: 'senha-segura' })).rejects.toMatchObject({
        codigo: 'ERR-030',
      });
    });

    it('recusa conta inativa com ERR-030', async () => {
      const inativo = await repositorio.criar({
        nome: 'Inativo',
        email: 'inativo@exemplo.com',
        senhaHash: await bcrypt.hash('senha-segura', CONFIG.jwt.saltRounds),
        ativo: false,
      });

      await expect(servico.login({ email: inativo.email, senha: 'senha-segura' })).rejects.toMatchObject({
        codigo: 'ERR-030',
      });
    });
  });

  describe('logout (RN-003)', () => {
    it('revoga o token revogando o seu jti', async () => {
      const sessao = await servico.registrar(ELANDRO);
      const payload = await jwt.verifyAsync<PayloadJwt>(sessao.token);

      await expect(revogacao.estaRevogado(payload.jti)).resolves.toBe(false);
      await servico.logout(payload.jti as string, payload.exp as number);
      await expect(revogacao.estaRevogado(payload.jti)).resolves.toBe(true);
    });
  });

  describe('usuarioAutenticado (RN-004)', () => {
    it('devolve os dados do dono do token', async () => {
      const sessao = await servico.registrar(ELANDRO);

      await expect(servico.usuarioAutenticado(sessao.id)).resolves.toEqual({
        id: sessao.id,
        nome: 'Elandro',
        email: 'elandro@exemplo.com',
        ativo: true,
      });
    });

    it('recusa usuário inexistente com ERR-031', async () => {
      await expect(servico.usuarioAutenticado(999)).rejects.toBeInstanceOf(TokenInvalidoError);
    });
  });
});
