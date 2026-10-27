/**
 * Porta de persistência da lista de tokens revogados (logout — RN-003).
 *
 * Mantida em banco para que o logout sobreviva a reinícios do processo e seja
 * compartilhado entre instâncias.
 */
export const TOKEN_REVOGADO_REPOSITORY = 'TOKEN_REVOGADO_REPOSITORY';

export interface TokenRevogadoRepository {
  /** Registra (ou atualiza) a revogação de um `jti` até `expiraEm`. */
  revogar(jti: string, expiraEm: Date): Promise<void>;
  /** `true` se o `jti` está revogado e ainda não expirou. */
  estaRevogado(jti: string, agora?: Date): Promise<boolean>;
  /** Remove revogações vencidas; devolve quantas removeu. */
  limparExpirados(agora?: Date): Promise<number>;
}
