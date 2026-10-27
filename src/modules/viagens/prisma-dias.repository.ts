import { Injectable } from '@nestjs/common';
import { DiaNaoEncontradoError } from '../../common/errors/dominio.error';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosDia, Dia } from './dia.model';
import { DiasRepository } from './dias.repository';

interface LinhaDia {
  readonly id: number;
  readonly viagemId: number;
  readonly numero: number;
  readonly data: string | null;
  readonly titulo: string | null;
  readonly destinoId: number | null;
}

/** Adaptador Prisma do repositório de dias (RN-008, RN-009, RN-034). */
@Injectable()
export class PrismaDiasRepository implements DiasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Dia[]> {
    const dias = await this.prisma.dia.findMany({
      where: { viagemId },
      orderBy: [{ numero: 'asc' }, { data: 'asc' }],
    });
    return dias.map((dia) => this.paraModelo(dia));
  }

  async buscarPorId(id: number): Promise<Dia | null> {
    const dia = await this.prisma.dia.findUnique({ where: { id } });
    return dia ? this.paraModelo(dia) : null;
  }

  async criar(viagemId: number, numeroDia: number, data: string | null): Promise<Dia> {
    const dia = await this.prisma.dia.create({
      data: { viagemId, numero: numeroDia, data },
    });
    return this.paraModelo(dia);
  }

  async atualizar(id: number, dados: DadosDia): Promise<Dia> {
    try {
      const dia = await this.prisma.dia.update({
        where: { id },
        data: {
          ...(dados.numeroDia === undefined ? {} : { numero: dados.numeroDia }),
          ...(dados.data === undefined ? {} : { data: dados.data }),
          ...(dados.titulo === undefined ? {} : { titulo: dados.titulo }),
          ...(dados.destinoId === undefined ? {} : { destinoId: dados.destinoId }),
        },
      });
      return this.paraModelo(dia);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new DiaNaoEncontradoError();
      }
      throw erro;
    }
  }

  async atualizarNumero(id: number, numeroDia: number): Promise<Dia> {
    return this.atualizar(id, { numeroDia });
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.dia.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new DiaNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluirPorViagem(viagemId: number): Promise<Dia[]> {
    return this.prisma.$transaction(async (tx) => {
      const dias = await tx.dia.findMany({ where: { viagemId } });
      await tx.dia.deleteMany({ where: { viagemId } });
      return dias.map((dia) => this.paraModelo(dia));
    });
  }

  private paraModelo(dia: LinhaDia): Dia {
    return {
      id: dia.id,
      viagemId: dia.viagemId,
      numeroDia: dia.numero,
      data: dia.data,
      titulo: dia.titulo,
      destinoId: dia.destinoId,
    };
  }
}
