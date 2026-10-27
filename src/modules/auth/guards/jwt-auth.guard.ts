import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenInvalidoError } from '../../../common/errors/dominio.error';
import { PayloadJwt, RequisicaoAutenticada, UsuarioDaRequisicao } from '../auth.types';
import { TokenRevocationService } from '../token-revocation.service';

const PREFIXO_BEARER = 'Bearer ';

/** Extrai o token do header `Authorization: Bearer <token>`. */
function extrairToken(header: string | undefined): string | null {
  if (!header || !header.startsWith(PREFIXO_BEARER)) {
    return null;
  }
  const token = header.slice(PREFIXO_BEARER.length).trim();
  return token.length > 0 ? token : null;
}

function identificarUsuario(payload: PayloadJwt): number | null {
  const sub = typeof payload.sub === 'string' ? Number(payload.sub) : payload.sub;
  return Number.isInteger(sub) && sub > 0 ? sub : null;
}

/**
 * Autenticação Bearer JWT (API_CONTRACTS § "Autenticação"; RN-002, RN-003).
 *
 * Valida assinatura/expiração, exige `jti` e recusa tokens revogados no logout.
 * Em sucesso, anexa `usuario` à requisição — é essa identidade que os módulos de
 * domínio usam para filtrar pelo dono do recurso (RN-004).
 *
 * Todo token ausente/inválido/expirado/revogado resulta em ERR-031 (401).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly revogacao: TokenRevocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requisicao = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const token = extrairToken(requisicao.headers.authorization);
    if (!token) {
      throw new TokenInvalidoError();
    }

    let payload: PayloadJwt;
    try {
      payload = await this.jwt.verifyAsync<PayloadJwt>(token);
    } catch {
      throw new TokenInvalidoError();
    }

    const id = identificarUsuario(payload);
    if (
      id === null ||
      typeof payload.exp !== 'number' ||
      (await this.revogacao.estaRevogado(payload.jti))
    ) {
      throw new TokenInvalidoError();
    }

    const usuario: UsuarioDaRequisicao = {
      id,
      email: payload.email ?? '',
      jti: payload.jti as string,
      exp: payload.exp,
    };
    requisicao.usuario = usuario;
    return true;
  }
}
