import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { CredenciaisInvalidasError, EmailJaCadastradoError, TokenInvalidoError } from '../../common/errors/dominio.error';
import { USUARIOS_REPOSITORY, UsuariosRepository } from '../usuarios/usuarios.repository';
import { Usuario, normalizarEmail } from '../usuarios/usuario.model';
import { AuthResponse, UsuarioAutenticadoResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { TokenRevocationService } from './token-revocation.service';

/**
 * Autenticação própria por e-mail/senha com JWT (RN-001 a RN-003).
 *
 * A senha nunca é persistida em texto puro: entra no bcrypt antes de chegar ao
 * repositório (SECURITY.md §3).
 */
@Injectable()
export class AuthService {
  /** Hash descartável usado só para equalizar o tempo de resposta do login. */
  private hashDescartavel?: string;

  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuarios: UsuariosRepository,
    private readonly jwt: JwtService,
    private readonly revogacao: TokenRevocationService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** RN-001 — cadastro com e-mail e senha; já devolve a sessão autenticada. */
  async registrar(dto: RegistrarDto): Promise<AuthResponse> {
    const email = normalizarEmail(dto.email);

    if (await this.usuarios.buscarPorEmail(email)) {
      throw new EmailJaCadastradoError();
    }

    const senhaHash = await bcrypt.hash(dto.senha, this.config.jwt.saltRounds);
    const usuario = await this.usuarios.criar({ nome: dto.nome.trim(), email, senhaHash, ativo: true });
    return this.emitirSessao(usuario);
  }

  /** RN-002 — autenticação por e-mail e senha; ERR-030 se inválidos. */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const usuario = await this.usuarios.buscarPorEmail(normalizarEmail(dto.email));

    // Compara também quando o usuário não existe, para não vazar (por tempo)
    // quais e-mails estão cadastrados.
    const senhaConfere = await bcrypt.compare(dto.senha, usuario?.senhaHash ?? this.obterHashDescartavel());
    if (!usuario || !usuario.ativo || !senhaConfere) {
      throw new CredenciaisInvalidasError();
    }

    return this.emitirSessao(usuario);
  }

  /** RN-003 — invalida a sessão: o `jti` deixa de ser aceito até expirar. */
  async logout(jti: string, exp: number): Promise<void> {
    await this.revogacao.revogar(jti, exp);
  }

  /** `GET /auth/me` — dados do usuário dono do token (RN-004). */
  async usuarioAutenticado(id: number): Promise<UsuarioAutenticadoResponse> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario || !usuario.ativo) {
      throw new TokenInvalidoError();
    }
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, ativo: usuario.ativo };
  }

  private async emitirSessao(usuario: Usuario): Promise<AuthResponse> {
    const token = await this.jwt.signAsync(
      { sub: usuario.id, email: usuario.email },
      { jwtid: randomUUID(), expiresIn: this.config.jwt.expiresIn },
    );
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, token };
  }

  private obterHashDescartavel(): string {
    this.hashDescartavel ??= bcrypt.hashSync('tripplanner-senha-descartavel', this.config.jwt.saltRounds);
    return this.hashDescartavel;
  }
}
