import { DadosViagem, Viagem } from './viagem.model';

/**
 * Porta do repositório de viagens (ACL — ARCHITECTURE §3).
 *
 * Toda consulta de domínio é filtrada pelo dono (RN-004); a unicidade da viagem
 * ativa (RN-006) é garantida pelas operações `ativar`/`desativarDoUsuario`.
 */
export const VIAGENS_REPOSITORY = 'VIAGENS_REPOSITORY';

export interface ViagensRepository {
  /** Viagens do usuário, em ordem de cadastro. */
  listarPorUsuario(usuarioId: number): Promise<Viagem[]>;
  buscarPorId(id: number): Promise<Viagem | null>;
  /** `true` se o usuário já possui viagem ativa (RN-006). */
  existeAtivaDoUsuario(usuarioId: number, ignorarId?: number): Promise<boolean>;
  criar(dados: DadosViagem): Promise<Viagem>;
  atualizar(id: number, dados: DadosViagem): Promise<Viagem>;
  excluir(id: number): Promise<void>;
  /** Marca a viagem como ativa (o chamador desativa as demais — RN-006). */
  ativar(id: number): Promise<Viagem>;
  /** Desativa todas as viagens do usuário (opcionalmente ignorando um id). */
  desativarDoUsuario(usuarioId: number, ignorarId?: number): Promise<void>;
}
