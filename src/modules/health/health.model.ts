/** Resposta de `GET /api/v1/health`. */
export interface BancoHealth {
  readonly status: 'ok' | 'erro';
  /** Tempo do `SELECT 1` em milissegundos (`null` quando falhou). */
  readonly latenciaMs: number | null;
  /** Host/banco conectado, sem credenciais. */
  readonly descricao: string;
}

export interface HealthResponse {
  readonly status: 'ok' | 'degradado';
  readonly aplicacao: string;
  readonly ambiente: string;
  readonly horario: string;
  readonly uptimeSegundos: number;
  readonly banco: BancoHealth;
  /** Estado efetivo do Swagger **nesta instância** (reflete o env do deploy). */
  readonly swagger: SwaggerHealth;
}

export interface SwaggerHealth {
  readonly habilitado: boolean;
  readonly caminho: string;
}
