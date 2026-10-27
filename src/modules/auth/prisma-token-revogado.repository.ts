import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { TokenRevogadoRepository } from './token-revogado.repository';

/** Adaptador Prisma da revogação de tokens (RN-003). */
@Injectable()
export class PrismaTokenRevogadoRepository implements TokenRevogadoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async revogar(jti: string, expiraEm: Date): Promise<void> {
    await this.prisma.tokenRevogado.upsert({
      where: { jti },
      create: { jti, expiraEm },
      update: { expiraEm },
    });
  }

  async estaRevogado(jti: string, agora: Date = new Date()): Promise<boolean> {
    const registro = await this.prisma.tokenRevogado.findUnique({ where: { jti } });
    if (!registro) {
      return false;
    }
    if (registro.expiraEm.getTime() <= agora.getTime()) {
      await this.prisma.tokenRevogado.delete({ where: { jti } }).catch(() => undefined);
      return false;
    }
    return true;
  }

  async limparExpirados(agora: Date = new Date()): Promise<number> {
    const resultado = await this.prisma.tokenRevogado.deleteMany({
      where: { expiraEm: { lte: agora } },
    });
    return resultado.count;
  }
}
