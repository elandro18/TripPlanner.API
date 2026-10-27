/**
 * Hospedagem — `TRIP_HOTEL`.
 *
 * O valor total é calculado como `valorNoite × noites` quando ambos são
 * informados, podendo ser ajustado manualmente (RN-017). É opcional: o
 * planejador permite registrar a hospedagem antes de saber os valores.
 */
export interface Hotel {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly dataHoraCheckin: string;
  readonly dataHoraCheckout: string;
  readonly valorNoite: number | null;
  readonly noites: number | null;
  /** Valor total em R$ (>= 0) ou `null` quando não informado. */
  readonly valorTotal: number | null;
  readonly reserva: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  /** Origem da coordenada: confirmado, aproximado ou manual. */
  readonly geoStatus: string | null;
}

/** Dados de entrada para criação/atualização de hotel. */
export interface DadosHotel {
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco?: string | null;
  readonly cidade?: string | null;
  readonly dataHoraCheckin: string;
  readonly dataHoraCheckout: string;
  readonly valorNoite?: number | null;
  readonly noites?: number | null;
  readonly valorTotal?: number | null;
  readonly reserva?: string | null;
  readonly fotoUrl?: string | null;
  readonly lat?: number | null;
  readonly lng?: number | null;
  readonly geoStatus?: string | null;
}

/**
 * Calcula o valor total do hotel (RN-017): `valorNoite × noites` quando ambos
 * informados; caso contrário devolve `null`.
 */
export function calcularValorTotal(
  valorNoite: number | null | undefined,
  noites: number | null | undefined,
): number | null {
  if (valorNoite === null || valorNoite === undefined || noites === null || noites === undefined) {
    return null;
  }
  return Math.round(valorNoite * noites * 100) / 100;
}
