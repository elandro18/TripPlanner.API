import { Injectable } from '@nestjs/common';
import { CardNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosRoteiro, Roteiro, TipoItemRoteiro } from './roteiro.model';
import { VinculosRoteiroRepository } from './vinculos-roteiro.repository';

interface LinhaRoteiro {
  readonly id: number;
  readonly viagemId: number;
  readonly diaId: number;
  readonly tipoItem: string;
  readonly itemId: number;
  readonly ordem: number;
  readonly inicio: string | null;
  readonly fim: string | null;
  readonly concluido: boolean;
  readonly concluidoEm: Date | null;
}

/** Adaptador Prisma da tabela de cards do roteiro. */
@Injectable()
export class PrismaVinculosRoteiroRepository implements VinculosRoteiroRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Roteiro[]> {
    const cards = await this.prisma.roteiro.findMany({
      where: { viagemId },
      orderBy: [{ dia: { numero: 'asc' } }, { ordem: 'asc' }, { id: 'asc' }],
    });
    return cards.map((card) => this.paraModelo(card));
  }

  async listarPorDia(diaId: number): Promise<Roteiro[]> {
    const cards = await this.prisma.roteiro.findMany({
      where: { diaId },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
    return cards.map((card) => this.paraModelo(card));
  }

  async buscarPorId(id: number): Promise<Roteiro | null> {
    const card = await this.prisma.roteiro.findUnique({ where: { id } });
    return card ? this.paraModelo(card) : null;
  }

  async criar(dados: DadosRoteiro): Promise<Roteiro> {
    const card = await this.prisma.roteiro.create({
      data: {
        viagemId: dados.viagemId,
        diaId: dados.diaId,
        tipoItem: dados.tipoItem,
        itemId: dados.itemId,
        ordem: dados.ordem ?? 0,
        inicio: dados.inicio ?? null,
        fim: dados.fim ?? null,
        concluido: dados.concluido ?? false,
        concluidoEm: dados.concluidoEm ? new Date(dados.concluidoEm) : null,
      },
    });
    return this.paraModelo(card);
  }

  async atualizar(
    id: number,
    dados: Partial<Omit<DadosRoteiro, 'viagemId' | 'tipoItem' | 'itemId'>>,
  ): Promise<Roteiro> {
    try {
      const card = await this.prisma.roteiro.update({
        where: { id },
        data: {
          ...(dados.diaId === undefined ? {} : { diaId: dados.diaId }),
          ...(dados.ordem === undefined ? {} : { ordem: dados.ordem }),
          ...(dados.inicio === undefined ? {} : { inicio: dados.inicio }),
          ...(dados.fim === undefined ? {} : { fim: dados.fim }),
          ...(dados.concluido === undefined ? {} : { concluido: dados.concluido }),
          ...(dados.concluidoEm === undefined
            ? {}
            : { concluidoEm: dados.concluidoEm ? new Date(dados.concluidoEm) : null }),
        },
      });
      return this.paraModelo(card);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new CardNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.roteiro.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new CardNaoEncontradoError();
      }
      throw erro;
    }
  }

  async reordenar(diaId: number, ordens: Array<{ id: number; ordem: number }>): Promise<void> {
    await this.prisma.$transaction(
      ordens.map(({ id, ordem }) =>
        this.prisma.roteiro.updateMany({ where: { id, diaId }, data: { ordem } }),
      ),
    );
  }

  async excluirPorItem(tipo: TipoItemRoteiro, itemId: number): Promise<number> {
    const resultado = await this.prisma.roteiro.deleteMany({
      where: { tipoItem: tipo, itemId },
    });
    return resultado.count;
  }

  async excluirPorDias(diaIds: number[]): Promise<number> {
    if (diaIds.length === 0) {
      return 0;
    }
    const resultado = await this.prisma.roteiro.deleteMany({
      where: { diaId: { in: diaIds } },
    });
    return resultado.count;
  }

  private paraModelo(card: LinhaRoteiro): Roteiro {
    return {
      id: card.id,
      viagemId: card.viagemId,
      diaId: card.diaId,
      tipoItem: card.tipoItem as TipoItemRoteiro,
      itemId: card.itemId,
      ordem: card.ordem,
      inicio: card.inicio,
      fim: card.fim,
      concluido: card.concluido,
      concluidoEm: card.concluidoEm ? card.concluidoEm.toISOString() : null,
    };
  }
}
