import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiErrorDetail } from '../errors/api-error';
import { ApiException } from '../errors/api.exception';
import { CODIGOS_ERRO } from '../errors/error-codes';
import { statusDoCodigo } from '../errors/error-status';
import { DominioError } from '../errors/dominio.error';

interface RespostaNormalizada {
  readonly status: HttpStatus;
  readonly erros: ApiErrorDetail[];
}

function detalheFallback(mensagem: string, detalhe: string | null = null): ApiErrorDetail {
  return { id: CODIGOS_ERRO.NAO_CATALOGADO, message: mensagem, field: null, detail: detalhe };
}

function mensagemDeHttpException(excecao: HttpException): string {
  const corpo = excecao.getResponse();
  if (typeof corpo === 'string') {
    return corpo;
  }
  const mensagem = (corpo as { message?: unknown }).message;
  if (typeof mensagem === 'string') {
    return mensagem;
  }
  if (Array.isArray(mensagem)) {
    return mensagem.map((item) => String(item)).join('; ');
  }
  return excecao.message;
}

/**
 * Traduz qualquer exceção para o envelope de erro do contrato (array).
 *
 * - `ApiException` / erros de validação → corpo já pronto (400, 409, ...).
 * - `DominioError` → código do catálogo + status mapeado (ERR-030 → 401 etc.).
 * - Demais `HttpException` (ex.: rota inexistente) → mantém o status e usa o
 *   código interno `ERR-000` (fora do catálogo, que só cobre erros previstos).
 * - Erros inesperados → 500 `ERR-099`, sem vazar detalhes internos.
 */
export function normalizarExcecao(excecao: unknown, logger?: Logger): RespostaNormalizada {
  if (excecao instanceof ApiException) {
    return { status: excecao.getStatus(), erros: excecao.erros };
  }

  if (excecao instanceof DominioError) {
    return { status: statusDoCodigo(excecao.codigo), erros: [excecao.paraDetalhe()] };
  }

  if (excecao instanceof HttpException) {
    const status = excecao.getStatus();
    return { status, erros: [detalheFallback(mensagemDeHttpException(excecao), excecao.name)] };
  }

  const erro = excecao as Error | undefined;
  logger?.error(`Erro não tratado: ${erro?.message ?? String(excecao)}`, erro?.stack);
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    erros: [
      {
        id: CODIGOS_ERRO.ERRO_INTERNO,
        message: 'Erro interno do servidor',
        field: null,
        detail: null,
      },
    ],
  };
}

/** Filtro global: garante que **toda** resposta de erro siga o contrato. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();
    if (resposta.headersSent) {
      return;
    }
    const { status, erros } = normalizarExcecao(excecao, this.logger);
    resposta.status(status).json(erros);
  }
}
