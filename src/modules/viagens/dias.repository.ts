import { DadosDia, Dia } from './dia.model';

/** Porta do repositório de dias (ACL — ARCHITECTURE §3). */
export const DIAS_REPOSITORY = 'DIAS_REPOSITORY';

export interface DiasRepository {
  /** Dias da viagem em **ordem cronológica** (RN-009). */
  listarPorViagem(viagemId: number): Promise<Dia[]>;
  buscarPorId(id: number): Promise<Dia | null>;
  criar(viagemId: number, numeroDia: number, data: string | null): Promise<Dia>;
  atualizar(id: number, dados: DadosDia): Promise<Dia>;
  /** Renumera o dia (a ordem é recalculada quando o período muda — RN-034). */
  atualizarNumero(id: number, numeroDia: number): Promise<Dia>;
  excluir(id: number): Promise<void>;
  /** Remove todos os dias da viagem; devolve os dias removidos. */
  excluirPorViagem(viagemId: number): Promise<Dia[]>;
}
