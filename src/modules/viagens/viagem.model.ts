/** Moedas aceitas pelo planejador. */
export const MOEDAS = ['BRL', 'USD', 'EUR'] as const;
export type Moeda = (typeof MOEDAS)[number];

/** Moeda padrão do MVP. */
export const MOEDA_PADRAO: Moeda = 'BRL';

/**
 * Viagem — agregado raiz do planejador.
 *
 * `comDatas` indica se a viagem tem período definido. Sem datas, os dias são
 * criados manualmente pelo usuário (`data = null`).
 */
export interface Viagem {
  readonly id: number;
  /** Dono da viagem — base do isolamento por usuário (RN-004). */
  readonly usuarioId: number;
  readonly nome: string;
  readonly destino: string;
  readonly comDatas: boolean;
  /** `YYYY-MM-DD` quando `comDatas`; `null` caso contrário. */
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly moeda: Moeda;
  /** Viagem ativa — no máximo uma por usuário (RN-006). */
  readonly ativa: boolean;
  /** Imagem de capa (URL http(s)) usada pela home/dashboard. */
  readonly capaUrl: string;
  /** Data de criação em ISO 8601. */
  readonly criadaEm: string;
}

/** Dados de entrada para criação/atualização de viagem. */
export interface DadosViagem {
  readonly usuarioId: number;
  readonly nome: string;
  readonly destino: string;
  readonly comDatas: boolean;
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly moeda?: Moeda;
  readonly ativa?: boolean;
  readonly capaUrl?: string;
}

/** Limite defensivo de dias gerados por viagem (período absurdo/abuso). */
const MAXIMO_DIAS = 3660;

/**
 * Datas do período, **inclusive nas duas pontas** (RN-034).
 *
 * Usa UTC para não sofrer com horário de verão. Sem datas, devolve `[]`.
 * Períodos acima de `MAXIMO_DIAS` (10 anos) são rejeitados como data final
 * inválida.
 */
export function datasDoPeriodo(
  dataInicio: string | null | undefined,
  dataFim: string | null | undefined,
): string[] {
  if (!dataInicio || !dataFim) {
    return [];
  }

  const inicio = Date.parse(`${dataInicio}T00:00:00Z`);
  const fim = Date.parse(`${dataFim}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim) || fim < inicio) {
    return [];
  }

  const totalDias = Math.round((fim - inicio) / 86_400_000) + 1;
  if (totalDias > MAXIMO_DIAS) {
    return [];
  }

  return Array.from({ length: totalDias }, (_, indice) =>
    new Date(inicio + indice * 86_400_000).toISOString().slice(0, 10),
  );
}
