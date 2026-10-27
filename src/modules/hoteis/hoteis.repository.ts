import { DadosHotel, Hotel } from './hotel.model';

/** Porta do repositório de hotéis (ACL — ARCHITECTURE §3). */
export const HOTEL_REPOSITORY = 'HOTEL_REPOSITORY';

export interface HoteisRepository {
  listarPorViagem(viagemId: number): Promise<Hotel[]>;
  buscarPorId(id: number): Promise<Hotel | null>;
  criar(dados: DadosHotel): Promise<Hotel>;
  atualizar(id: number, dados: DadosHotel): Promise<Hotel>;
  excluir(id: number): Promise<void>;
  /** Remove todos os hotéis da viagem (RN-007). */
  excluirPorViagem(viagemId: number): Promise<number>;
}
