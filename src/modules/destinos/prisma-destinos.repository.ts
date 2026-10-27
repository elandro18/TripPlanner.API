import { Injectable } from '@nestjs/common';
import { DestinoNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosDestino, Destino } from './destino.model';
import { DestinosRepository } from './destinos.repository';

interface LinhaDestino {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly cidade: string | null;
  readonly pais: string | null;
  readonly ordem: number;
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
}

/** Adaptador Prisma do repositório de destinos. */
@Injectable()
export class PrismaDestinosRepository implements DestinosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Destino[]> {
    const destinos = await this.prisma.destino.findMany({
      where: { viagemId },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
    return destinos.map((destino) => this.paraModelo(destino));
  }

  async buscarPorId(id: number): Promise<Destino | null> {
    const destino = await this.prisma.destino.findUnique({ where: { id } });
    return destino ? this.paraModelo(destino) : null;
  }

  async criar(dados: DadosDestino): Promise<Destino> {
    const destino = await this.prisma.destino.create({
      data: {
        viagemId: dados.viagemId,
        nome: dados.nome,
        cidade: dados.cidade ?? null,
        pais: dados.pais ?? null,
        ordem: dados.ordem ?? 0,
        dataInicio: dados.dataInicio ?? null,
        dataFim: dados.dataFim ?? null,
        lat: dados.lat ?? null,
        lng: dados.lng ?? null,
      },
    });
    return this.paraModelo(destino);
  }

  async atualizar(id: number, dados: DadosDestino): Promise<Destino> {
    try {
      const destino = await this.prisma.destino.update({
        where: { id },
        data: {
          nome: dados.nome,
          cidade: dados.cidade ?? null,
          pais: dados.pais ?? null,
          ...(dados.ordem === undefined ? {} : { ordem: dados.ordem }),
          dataInicio: dados.dataInicio ?? null,
          dataFim: dados.dataFim ?? null,
          lat: dados.lat ?? null,
          lng: dados.lng ?? null,
        },
      });
      return this.paraModelo(destino);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new DestinoNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.destino.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new DestinoNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluirPorViagem(viagemId: number): Promise<number> {
    const resultado = await this.prisma.destino.deleteMany({ where: { viagemId } });
    return resultado.count;
  }

  async reordenar(viagemId: number, ids: number[]): Promise<Destino[]> {
    await this.prisma.$transaction(
      ids.map((id, ordem) =>
        this.prisma.destino.updateMany({
          where: { id, viagemId },
          data: { ordem },
        }),
      ),
    );
    return this.listarPorViagem(viagemId);
  }

  private paraModelo(destino: LinhaDestino): Destino {
    return {
      id: destino.id,
      viagemId: destino.viagemId,
      nome: destino.nome,
      cidade: destino.cidade,
      pais: destino.pais,
      ordem: destino.ordem,
      dataInicio: destino.dataInicio,
      dataFim: destino.dataFim,
      lat: destino.lat,
      lng: destino.lng,
    };
  }
}
