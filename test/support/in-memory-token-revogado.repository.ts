import { TokenRevogadoRepository } from '../../src/modules/auth/token-revogado.repository';

/** Dublê em memória da revogação de tokens (RN-003). */
export class InMemoryTokenRevogadoRepository implements TokenRevogadoRepository {
  private readonly revogados = new Map<string, Date>();

  async revogar(jti: string, expiraEm: Date): Promise<void> {
    this.revogados.set(jti, expiraEm);
  }

  async estaRevogado(jti: string, agora: Date = new Date()): Promise<boolean> {
    const expiraEm = this.revogados.get(jti);
    if (!expiraEm) {
      return false;
    }
    if (expiraEm.getTime() <= agora.getTime()) {
      this.revogados.delete(jti);
      return false;
    }
    return true;
  }

  async limparExpirados(agora: Date = new Date()): Promise<number> {
    let removidos = 0;
    for (const [jti, expiraEm] of this.revogados) {
      if (expiraEm.getTime() <= agora.getTime()) {
        this.revogados.delete(jti);
        removidos += 1;
      }
    }
    return removidos;
  }

  get tamanho(): number {
    return this.revogados.size;
  }
}
