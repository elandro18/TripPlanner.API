import { EmailJaCadastradoError } from '../../src/common/errors/dominio.error';
import { NovoUsuario, Usuario, normalizarEmail } from '../../src/modules/usuarios/usuario.model';
import { UsuariosRepository } from '../../src/modules/usuarios/usuarios.repository';

/**
 * Dublê em memória do repositório de usuários.
 *
 * Os testes (unitários e e2e) **não** acessam o banco real: este dublê é
 * injetado no lugar de `USUARIOS_REPOSITORY` quando o cenário só precisa de
 * contas em memória.
 */
export class InMemoryUsuariosRepository implements UsuariosRepository {
  private readonly usuarios: Usuario[] = [];
  private sequencia = 0;

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const alvo = normalizarEmail(email);
    return this.usuarios.find((usuario) => usuario.email === alvo) ?? null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.id === id) ?? null;
  }

  async criar(dados: NovoUsuario): Promise<Usuario> {
    const email = normalizarEmail(dados.email);
    if (this.usuarios.some((usuario) => usuario.email === email)) {
      throw new EmailJaCadastradoError();
    }

    const usuario: Usuario = {
      id: ++this.sequencia,
      nome: dados.nome,
      email,
      senhaHash: dados.senhaHash,
      ativo: dados.ativo !== false,
    };
    this.usuarios.push(usuario);
    return usuario;
  }

  /** Cópia dos registros — usada para inspeção nos testes. */
  get todos(): Usuario[] {
    return [...this.usuarios];
  }
}
