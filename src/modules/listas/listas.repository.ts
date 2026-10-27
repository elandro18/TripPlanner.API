import { DadosLista, DadosListaItem, Lista, ListaItem } from './lista.model';

/** Porta do repositório de listas e itens. */
export const LISTAS_REPOSITORY = 'LISTAS_REPOSITORY';

export interface ListasRepository {
  listarPorUsuario(usuarioId: number, viagemId?: number | null): Promise<Lista[]>;
  buscarPorId(id: number): Promise<Lista | null>;
  criar(dados: DadosLista): Promise<Lista>;
  atualizar(id: number, dados: DadosLista): Promise<Lista>;
  excluir(id: number): Promise<void>;

  listarItens(listaId: number): Promise<ListaItem[]>;
  buscarItemPorId(id: number): Promise<ListaItem | null>;
  criarItem(dados: DadosListaItem): Promise<ListaItem>;
  atualizarItem(id: number, dados: Partial<DadosListaItem>): Promise<ListaItem>;
  excluirItem(id: number): Promise<void>;
  reordenarItens(listaId: number, ordens: Array<{ id: number; ordem: number }>): Promise<void>;
}
