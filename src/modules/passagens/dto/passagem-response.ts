import { ImportadoDe, Passagem } from '../passagem.model';

/** Passagem como exposta na API (`API_CONTRACTS.md` §5). */
export interface PassagemResponse {
  readonly id: number;
  readonly viagemId: number;
  readonly tipo: string;
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
  readonly valor: number | null;
  readonly documentoHash: string | null;
  readonly importadoDe: ImportadoDe | null;
}

export function paraPassagemResponse(passagem: Passagem): PassagemResponse {
  return {
    id: passagem.id,
    viagemId: passagem.viagemId,
    tipo: passagem.tipo,
    origem: passagem.origem,
    destino: passagem.destino,
    dataHoraPartida: passagem.dataHoraPartida,
    dataHoraChegada: passagem.dataHoraChegada,
    companhia: passagem.companhia,
    localizador: passagem.localizador,
    numeroBilhete: passagem.numeroBilhete,
    passageiro: passagem.passageiro,
    classe: passagem.classe,
    terminal: passagem.terminal,
    assento: passagem.assento,
    moeda: passagem.moeda,
    valor: passagem.valor,
    documentoHash: passagem.documentoHash,
    importadoDe: passagem.importadoDe,
  };
}
