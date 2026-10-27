/** Destino de uma viagem (permite múltiplos destinos por viagem). */
export interface Destino {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly cidade: string | null;
  readonly pais: string | null;
  readonly ordem: number;
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
}

/** Dados de entrada para criação/atualização de destino. */
export interface DadosDestino {
  readonly viagemId: number;
  readonly nome: string;
  readonly cidade?: string | null;
  readonly pais?: string | null;
  readonly ordem?: number;
  readonly dataInicio?: string | null;
  readonly dataFim?: string | null;
  readonly lat?: number | null;
  readonly lng?: number | null;
}
