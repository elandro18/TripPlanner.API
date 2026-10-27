/** Tipo do item vinculado a um card do roteiro (FK polimórfica). */
export type TipoItemRoteiro = 'LOCAL' | 'PASSAGEM' | 'HOTEL';

export const TIPOS_ITEM_ROTEIRO: readonly TipoItemRoteiro[] = [
  'LOCAL',
  'PASSAGEM',
  'HOTEL',
];

/** Card do roteiro (dia + item). */
export interface Roteiro {
  readonly id: number;
  readonly viagemId: number;
  readonly diaId: number;
  readonly tipoItem: TipoItemRoteiro;
  readonly itemId: number;
  readonly ordem: number;
  readonly inicio: string | null;
  readonly fim: string | null;
  readonly concluido: boolean;
  readonly concluidoEm: string | null;
}

/** Dados de entrada para criação/atualização de um card. */
export interface DadosRoteiro {
  readonly viagemId: number;
  readonly diaId: number;
  readonly tipoItem: TipoItemRoteiro;
  readonly itemId: number;
  readonly ordem?: number;
  readonly inicio?: string | null;
  readonly fim?: string | null;
  readonly concluido?: boolean;
  readonly concluidoEm?: string | null;
}
