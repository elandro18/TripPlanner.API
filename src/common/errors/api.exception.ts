import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorDetail } from './api-error';
import { CODIGOS_ERRO } from './error-codes';

/**
 * Exceção HTTP já no formato do contrato: corpo é **sempre** um array de
 * `ApiErrorDetail` (`specs/API_CONTRACTS.md` § "Envelope de Erro").
 *
 * Usada quando o erro tem status próprio e/ou múltiplos itens — o caso típico é
 * o agregado de validação de DTO produzido por `validationExceptionFactory`.
 */
export class ApiException extends HttpException {
  readonly erros: ApiErrorDetail[];

  constructor(erros: ApiErrorDetail | ApiErrorDetail[], status: HttpStatus) {
    const lista: ApiErrorDetail[] = Array.isArray(erros) ? erros : [erros];
    super(lista, status);
    this.erros = lista;
  }

  /** Exceção de erro interno não catalogado (ERR-099, 500). */
  static interno(): ApiException {
    return new ApiException(
      [
        {
          id: CODIGOS_ERRO.ERRO_INTERNO,
          message: 'Erro interno do servidor',
          field: null,
          detail: null,
        },
      ],
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
