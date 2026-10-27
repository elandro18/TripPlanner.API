import type { Request } from 'express';

/** Resposta de cadastro/login — `{ id, nome, email, token }` (API_CONTRACTS §1.1, §1.2). */
export interface AuthResponse {
  readonly id: number;
  readonly nome: string;
  readonly email: string;
  readonly token: string;
}

/** Resposta de `GET /api/v1/auth/me` (API_CONTRACTS §1.4). */
export interface UsuarioAutenticadoResponse {
  readonly id: number;
  readonly nome: string;
  readonly email: string;
  readonly ativo: boolean;
}

/** Conteúdo do JWT emitido pela API. */
export interface PayloadJwt {
  /** `NRO_INT_USUARIO` do dono da sessão. */
  readonly sub: number | string;
  readonly email?: string;
  /** Identificador único do token — base da revogação no logout (RN-003). */
  readonly jti?: string;
  /** Expiração em segundos (epoch). */
  readonly exp?: number;
  readonly iat?: number;
}

/** Identidade autenticada derivada do JWT, anexada à requisição pelo guard. */
export interface UsuarioDaRequisicao {
  readonly id: number;
  readonly email: string;
  readonly jti: string;
  /** Expiração do token em segundos (epoch) — usada na revogação. */
  readonly exp: number;
}

/** Requisição HTTP com a identidade autenticada (RN-004: filtro por dono). */
export interface RequisicaoAutenticada extends Request {
  usuario?: UsuarioDaRequisicao;
}
