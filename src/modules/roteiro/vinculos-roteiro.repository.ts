import { DadosRoteiro, Roteiro, TipoItemRoteiro } from './roteiro.model';

/**
 * Porta de acesso à tabela de cards do roteiro.
 *
 * Além do CRUD, expõe as remoções em cascata exigidas pelas RNs de exclusão:
 * RN-007 (excluir viagem), RN-011/RN-015/RN-018 (excluir item) e RN-034 (mudar
 * o período).
 */
export const VINCULOS_ROTEIRO_REPOSITORY = 'VINCULOS_ROTEIRO_REPOSITORY';

export interface VinculosRoteiroRepository {
  listarPorViagem(viagemId: number): Promise<Roteiro[]>;
  listarPorDia(diaId: number): Promise<Roteiro[]>;
  buscarPorId(id: number): Promise<Roteiro | null>;
  criar(dados: DadosRoteiro): Promise<Roteiro>;
  atualizar(
    id: number,
    dados: Partial<Omit<DadosRoteiro, 'viagemId' | 'tipoItem' | 'itemId'>>,
  ): Promise<Roteiro>;
  excluir(id: number): Promise<void>;
  reordenar(diaId: number, ordens: Array<{ id: number; ordem: number }>): Promise<void>;
  /** Remove os cards que apontam para o item informado; devolve quantos removeu. */
  excluirPorItem(tipo: TipoItemRoteiro, itemId: number): Promise<number>;
  /** Remove os cards dos dias informados; devolve quantos removeu. */
  excluirPorDias(diaIds: number[]): Promise<number>;
}
