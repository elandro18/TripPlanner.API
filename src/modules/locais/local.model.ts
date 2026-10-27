/**
 * Local a visitar — `TRIP_LOCAL`.
 *
 * O endereço é usado na geocodificação para o cálculo de deslocamento
 * (RN-035) e o custo é opcional (zero = gratuito — RN-012).
 */
export interface Local {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly categoria: string | null;
  /** Horário previsto de chegada (`HH:MM`). */
  readonly horarioPrevisto: string | null;
  /** Horário previsto de saída (`HH:MM`). */
  readonly horarioFim: string | null;
  /** Horário de abertura do estabelecimento (`HH:MM`). */
  readonly horarioAbertura: string | null;
  /** Horário de fechamento do estabelecimento (`HH:MM`). */
  readonly horarioFechamento: string | null;
  /** Duração estimada em minutos. */
  readonly duracaoEstimada: number | null;
  /** Custo em R$ (`null` = não informado; `0` = gratuito). */
  readonly custo: number | null;
  readonly observacoes: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  /** Origem da coordenada: confirmado, aproximado ou manual. */
  readonly geoStatus: string | null;
}

/** Dados de entrada para criação/atualização de local. */
export interface DadosLocal {
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco?: string | null;
  readonly cidade?: string | null;
  readonly categoria?: string | null;
  readonly horarioPrevisto?: string | null;
  readonly horarioFim?: string | null;
  readonly horarioAbertura?: string | null;
  readonly horarioFechamento?: string | null;
  readonly duracaoEstimada?: number | null;
  readonly custo?: number | null;
  readonly observacoes?: string | null;
  readonly fotoUrl?: string | null;
  readonly lat?: number | null;
  readonly lng?: number | null;
  readonly geoStatus?: string | null;
}
