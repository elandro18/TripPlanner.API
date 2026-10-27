/**
 * Envelope de listagem com paginação **offset** (API_CONTRACTS § Convenções).
 */
export interface RespostaPaginada<T> {
  readonly content: T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/**
 * Monta o envelope paginado a partir da coleção completa.
 *
 * A planilha não oferece consulta paginada, então o filtro/paginação ocorre em
 * memória (MVP) — a paginação é aplicada depois do filtro por dono (RN-004).
 */
export function paginar<T>(itens: readonly T[], page: number, size: number): RespostaPaginada<T> {
  const totalElements = itens.length;
  const inicio = page * size;

  return {
    content: itens.slice(inicio, inicio + size),
    page,
    size,
    totalElements,
    totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
  };
}
