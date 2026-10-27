import { Usuario, NovoUsuario } from './usuario.model';

/**
 * Porta do repositório de usuários (padrão Repository + ACL — ARCHITECTURE §3).
 *
 * O domínio não conhece o banco: a implementação concreta (`PrismaUsuariosRepository`)
 * é injetada pelo token `USUARIOS_REPOSITORY`, o que permite trocar a
 * persistência e substituir por um dublê nos testes.
 */
export const USUARIOS_REPOSITORY = 'USUARIOS_REPOSITORY';

export interface UsuariosRepository {
  /** Busca pelo e-mail de login (normalizado — `TXT_EMAIL_USUARIO`). */
  buscarPorEmail(email: string): Promise<Usuario | null>;
  /** Busca pela PK (`NRO_INT_USUARIO`). */
  buscarPorId(id: number): Promise<Usuario | null>;
  /** Cria o usuário; falha com ERR-040 se o e-mail já existir. */
  criar(dados: NovoUsuario): Promise<Usuario>;
}
