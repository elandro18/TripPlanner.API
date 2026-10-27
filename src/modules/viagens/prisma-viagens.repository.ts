import { Injectable } from '@nestjs/common';
import { ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosViagem, MOEDA_PADRAO, Moeda, Viagem } from './viagem.model';
import { ViagensRepository } from './viagens.repository';

interface LinhaViagem {
  readonly id: number;
  readonly usuarioId: number;
  readonly nome: string;
  readonly destino: string;
  readonly comDatas: boolean;
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly moeda: string;
  readonly ativa: boolean;
  readonly capaUrl: string;
  readonly criadaEm: Date;
}

/** Adaptador Prisma do repositório de viagens (RN-004 a RN-007). */
@Injectable()
export class PrismaViagensRepository implements ViagensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorUsuario(usuarioId: number): Promise<Viagem[]> {
    const viagens = await this.prisma.viagem.findMany({
      where: { usuarioId },
      orderBy: { id: 'asc' },
    });
    return viagens.map((viagem) => this.paraModelo(viagem));
  }

  async buscarPorId(id: number): Promise<Viagem | null> {
    const viagem = await this.prisma.viagem.findUnique({ where: { id } });
    return viagem ? this.paraModelo(viagem) : null;
  }

  async existeAtivaDoUsuario(usuarioId: number, ignorarId?: number): Promise<boolean> {
    const total = await this.prisma.viagem.count({
      where: { usuarioId, ativa: true, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
    });
    return total > 0;
  }

  async criar(dados: DadosViagem): Promise<Viagem> {
    const viagem = await this.prisma.viagem.create({
      data: {
        usuarioId: dados.usuarioId,
        nome: dados.nome,
        destino: dados.destino,
        comDatas: dados.comDatas,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        moeda: dados.moeda ?? MOEDA_PADRAO,
        ativa: dados.ativa ?? true,
        capaUrl: dados.capaUrl ?? '',
      },
    });
    return this.paraModelo(viagem);
  }

  async atualizar(id: number, dados: DadosViagem): Promise<Viagem> {
    try {
      const viagem = await this.prisma.viagem.update({
        where: { id },
        data: {
          nome: dados.nome,
          destino: dados.destino,
          comDatas: dados.comDatas,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim,
          moeda: dados.moeda ?? MOEDA_PADRAO,
          capaUrl: dados.capaUrl ?? '',
          ...(dados.ativa === undefined ? {} : { ativa: dados.ativa }),
        },
      });
      return this.paraModelo(viagem);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ViagemNaoEncontradaError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.viagem.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ViagemNaoEncontradaError();
      }
      throw erro;
    }
  }

  async ativar(id: number): Promise<Viagem> {
    try {
      const viagem = await this.prisma.viagem.update({
        where: { id },
        data: { ativa: true },
      });
      return this.paraModelo(viagem);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ViagemNaoEncontradaError();
      }
      throw erro;
    }
  }

  async desativarDoUsuario(usuarioId: number, ignorarId?: number): Promise<void> {
    await this.prisma.viagem.updateMany({
      where: { usuarioId, ativa: true, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
      data: { ativa: false },
    });
  }

  private paraModelo(viagem: LinhaViagem): Viagem {
    return {
      id: viagem.id,
      usuarioId: viagem.usuarioId,
      nome: viagem.nome,
      destino: viagem.destino,
      comDatas: viagem.comDatas,
      dataInicio: viagem.dataInicio,
      dataFim: viagem.dataFim,
      moeda: (viagem.moeda as Moeda) ?? MOEDA_PADRAO,
      ativa: viagem.ativa,
      capaUrl: viagem.capaUrl,
      criadaEm: viagem.criadaEm.toISOString(),
    };
  }
}
