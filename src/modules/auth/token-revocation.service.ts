import { Inject, Injectable } from '@nestjs/common';
import { TOKEN_REVOGADO_REPOSITORY, TokenRevogadoRepository } from './token-revogado.repository';

/**
 * Revogação de tokens (logout — RN-003).
 *
 * O JWT é *stateless*: para que o token emitido deixe de ser aceito após o
 * logout, o `jti` é registrado em uma tabela até a sua expiração. A porta
 * `TokenRevogadoRepository` isola o mecanismo de persistência do guard.
 */
@Injectable()
export class TokenRevocationService {
  constructor(
    @Inject(TOKEN_REVOGADO_REPOSITORY)
    private readonly repositorio: TokenRevogadoRepository,
  ) {}

  /** Revoga um token pelo `jti`; `exp` é o `exp` do JWT em segundos (epoch). */
  async revogar(jti: string, exp: number): Promise<void> {
    await this.repositorio.limparExpirados();
    await this.repositorio.revogar(jti, new Date(exp * 1000));
  }

  /** `true` se o token estiver revogado (ou sem `jti`, o que o torna inválido). */
  async estaRevogado(jti: string | undefined): Promise<boolean> {
    if (!jti) {
      return true;
    }
    return this.repositorio.estaRevogado(jti);
  }

  /** Remove revogações expiradas (diagnóstico/limpeza). */
  async limparExpirados(): Promise<number> {
    return this.repositorio.limparExpirados();
  }
}
