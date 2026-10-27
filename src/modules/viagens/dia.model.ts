/**
 * Dia da viagem — coluna do Kanban (RN-008).
 *
 * Cada dia é uma coluna do Kanban e os dias são gerados automaticamente a
 * partir do período da viagem (RN-034) ou criados manualmente quando a viagem
 * não tem datas.
 */
export interface Dia {
  readonly id: number;
  readonly viagemId: number;
  /** Número sequencial do dia na viagem (1, 2, 3...) — ordem cronológica (RN-009). */
  readonly numeroDia: number;
  /** Data do dia (`YYYY-MM-DD`) ou `null` quando a viagem não tem datas. */
  readonly data: string | null;
  /** Rótulo opcional da coluna. */
  readonly titulo: string | null;
  /** Destino associado ao dia (opcional). */
  readonly destinoId: number | null;
}

/** Campos editáveis de um dia. */
export interface DadosDia {
  readonly numeroDia?: number;
  readonly data?: string | null;
  readonly titulo?: string | null;
  readonly destinoId?: number | null;
}
