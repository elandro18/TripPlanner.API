import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenInvalidoError } from '../../../common/errors/dominio.error';
import { RequisicaoAutenticada, UsuarioDaRequisicao } from '../auth.types';

/**
 * Injeta a identidade autenticada (anexada pelo `JwtAuthGuard`).
 *
 * Uso: `meuEndpoint(@UsuarioAtual() usuario: UsuarioDaRequisicao)`.
 */
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioDaRequisicao => {
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (!requisicao.usuario) {
      throw new TokenInvalidoError();
    }
    return requisicao.usuario;
  },
);
