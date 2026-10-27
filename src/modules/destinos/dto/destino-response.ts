import { Destino } from '../destino.model';

export interface DestinoResponse {
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

export function paraDestinoResponse(destino: Destino): DestinoResponse {
  return {
    id: destino.id,
    viagemId: destino.viagemId,
    nome: destino.nome,
    cidade: destino.cidade,
    pais: destino.pais,
    ordem: destino.ordem,
    dataInicio: destino.dataInicio,
    dataFim: destino.dataFim,
    lat: destino.lat,
    lng: destino.lng,
  };
}
