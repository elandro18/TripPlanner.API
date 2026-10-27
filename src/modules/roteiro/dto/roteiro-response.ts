import { Roteiro, TipoItemRoteiro } from '../roteiro.model';

export interface RoteiroResponse {
  readonly id: number;
  readonly viagemId: number;
  readonly diaId: number;
  readonly tipo: TipoItemRoteiro;
  readonly itemId: number;
  readonly ordem: number;
  readonly horarioInicio: string | null;
  readonly horarioFim: string | null;
  readonly concluido: boolean;
}

export function paraRoteiroResponse(card: Roteiro): RoteiroResponse {
  return {
    id: card.id,
    viagemId: card.viagemId,
    diaId: card.diaId,
    tipo: card.tipoItem,
    itemId: card.itemId,
    ordem: card.ordem,
    horarioInicio: card.inicio,
    horarioFim: card.fim,
    concluido: card.concluido,
  };
}
