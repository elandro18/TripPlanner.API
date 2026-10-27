/**
 * Item do envelope de erro da API.
 *
 * Envelope **sempre em array**, mesmo para erro único
 * (`specs/API_CONTRACTS.md` § "Envelope de Erro").
 */
export interface ApiErrorDetail {
  /** Código do catálogo de erros (ex.: `ERR-001`). */
  readonly id: string;
  /** Mensagem legível ao usuário. */
  readonly message: string;
  /** Campo do payload que originou o erro (`null` quando não se aplica). */
  readonly field: string | null;
  /** Detalhe técnico adicional (`null` quando não há). */
  readonly detail: string | null;
}
