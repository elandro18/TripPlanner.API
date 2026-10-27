/**
 * Modelo de domínio do usuário.
 *
 * Mapeamento para a aba `TRIP_USUARIO` (`specs/DATA_MODEL.md` §2.1):
 * `NRO_INT_USUARIO`, `NOME_USUARIO`, `TXT_EMAIL_USUARIO`, `TXT_SENHA_USUARIO`,
 * `IND_ATIVO_USUARIO`.
 */
export interface Usuario {
  readonly id: number;
  readonly nome: string;
  readonly email: string;
  /** Hash da senha — nunca a senha em texto puro (SECURITY.md §3). */
  readonly senhaHash: string;
  readonly ativo: boolean;
}

export interface NovoUsuario {
  readonly nome: string;
  readonly email: string;
  readonly senhaHash: string;
  /** `true` (S) por padrão. */
  readonly ativo?: boolean;
}

/** Normaliza o e-mail de login: `trim` + minúsculas (unicidade — RN-001). */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
