import { DadosPassagem, Passagem } from './passagem.model';

/** Porta do repositório de passagens (ACL — ARCHITECTURE §3). */
export const PASSAGEM_REPOSITORY = 'PASSAGEM_REPOSITORY';

export interface PassagensRepository {
  listarPorViagem(viagemId: number): Promise<Passagem[]>;
  buscarPorId(id: number): Promise<Passagem | null>;
  criar(dados: DadosPassagem): Promise<Passagem>;
  atualizar(id: number, dados: DadosPassagem): Promise<Passagem>;
  excluir(id: number): Promise<void>;
  /** Remove todas as passagens da viagem (RN-007). */
  excluirPorViagem(viagemId: number): Promise<number>;
}
