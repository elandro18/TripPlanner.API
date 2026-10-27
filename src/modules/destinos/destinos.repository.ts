import { DadosDestino, Destino } from './destino.model';

/** Porta do repositório de destinos. */
export const DESTINOS_REPOSITORY = 'DESTINOS_REPOSITORY';

export interface DestinosRepository {
  listarPorViagem(viagemId: number): Promise<Destino[]>;
  buscarPorId(id: number): Promise<Destino | null>;
  criar(dados: DadosDestino): Promise<Destino>;
  atualizar(id: number, dados: DadosDestino): Promise<Destino>;
  excluir(id: number): Promise<void>;
  excluirPorViagem(viagemId: number): Promise<number>;
  /** Define a ordem dos destinos conforme a lista de ids (transação). */
  reordenar(viagemId: number, ids: number[]): Promise<Destino[]>;
}
