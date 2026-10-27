import { DadosLocal, Local } from './local.model';

/** Porta do repositório de locais (ACL — ARCHITECTURE §3). */
export const LOCAIS_REPOSITORY = 'LOCAIS_REPOSITORY';

export interface LocaisRepository {
  listarPorViagem(viagemId: number): Promise<Local[]>;
  buscarPorId(id: number): Promise<Local | null>;
  criar(dados: DadosLocal): Promise<Local>;
  atualizar(id: number, dados: DadosLocal): Promise<Local>;
  excluir(id: number): Promise<void>;
  /** Remove todos os locais da viagem (RN-007). */
  excluirPorViagem(viagemId: number): Promise<number>;
}
