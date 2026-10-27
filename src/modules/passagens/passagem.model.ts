/**
 * Tipo de passagem — enum fechado sem acento (RN-014).
 * Os rótulos de exibição (Avião/Trem/Ônibus) são responsabilidade da UI.
 */
export type TipoPassagem = 'AVIAO' | 'TREM' | 'ONIBUS';

export const TIPOS_PASSAGEM: readonly TipoPassagem[] = ['AVIAO', 'TREM', 'ONIBUS'];

/** Tipo de importação que originou a passagem. */
export type ImportadoDe = 'pdf' | 'imagem' | 'manual';

/**
 * Passagem (trecho de transporte) — `TRIP_PASSAGEM`.
 *
 * `dataHoraPartida`/`dataHoraChegada` seguem o formato ISO do contrato
 * (`YYYY-MM-DDTHH:mm:ssZ`).
 */
export interface Passagem {
  readonly id: number;
  readonly viagemId: number;
  readonly tipo: TipoPassagem;
  readonly origem: string;
  readonly destino: string;
  readonly dataHoraPartida: string;
  readonly dataHoraChegada: string | null;
  readonly companhia: string | null;
  readonly localizador: string | null;
  readonly numeroBilhete: string | null;
  readonly passageiro: string | null;
  readonly classe: string | null;
  readonly terminal: string | null;
  readonly assento: string | null;
  readonly moeda: string | null;
  /** Valor em R$ (>= 0) ou `null` quando não informado. */
  readonly valor: number | null;
  /** SHA-256 do documento importado (evita duplicidade). */
  readonly documentoHash: string | null;
  readonly importadoDe: ImportadoDe | null;
}

/** Dados de entrada para criação/atualização de passagem. */
export interface DadosPassagem {
  readonly viagemId: number;
  readonly tipo: TipoPassagem;
  readonly origem: string;
  readonly destino: string;
  readonly dataHoraPartida: string;
  readonly dataHoraChegada?: string | null;
  readonly companhia?: string | null;
  readonly localizador?: string | null;
  readonly numeroBilhete?: string | null;
  readonly passageiro?: string | null;
  readonly classe?: string | null;
  readonly terminal?: string | null;
  readonly assento?: string | null;
  readonly moeda?: string | null;
  readonly valor?: number | null;
  readonly documentoHash?: string | null;
  readonly importadoDe?: ImportadoDe | null;
}
