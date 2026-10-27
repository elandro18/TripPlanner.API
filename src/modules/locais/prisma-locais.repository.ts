import { Injectable } from '@nestjs/common';
import { LocalNaoEncontradoError } from '../../common/errors/dominio.error';
import { deCentavos, paraCentavos } from '../../common/utils/dinheiro';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosLocal, Local } from './local.model';
import { LocaisRepository } from './locais.repository';

interface LinhaLocal {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly categoria: string | null;
  readonly horarioPrevisto: string | null;
  readonly horarioFim: string | null;
  readonly horarioAbertura: string | null;
  readonly horarioFechamento: string | null;
  readonly duracaoMin: number | null;
  readonly custoCentavos: number | null;
  readonly observacoes: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly geoStatus: string | null;
}

/** Adaptador Prisma do repositório de locais (RN-010, RN-011, RN-012). */
@Injectable()
export class PrismaLocaisRepository implements LocaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Local[]> {
    const locais = await this.prisma.local.findMany({
      where: { viagemId },
      orderBy: { id: 'asc' },
    });
    return locais.map((local) => this.paraModelo(local));
  }

  async buscarPorId(id: number): Promise<Local | null> {
    const local = await this.prisma.local.findUnique({ where: { id } });
    return local ? this.paraModelo(local) : null;
  }

  async criar(dados: DadosLocal): Promise<Local> {
    const local = await this.prisma.local.create({ data: this.paraDados(dados) });
    return this.paraModelo(local);
  }

  async atualizar(id: number, dados: DadosLocal): Promise<Local> {
    try {
      const local = await this.prisma.local.update({
        where: { id },
        data: this.paraDados(dados),
      });
      return this.paraModelo(local);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new LocalNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.local.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new LocalNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluirPorViagem(viagemId: number): Promise<number> {
    const resultado = await this.prisma.local.deleteMany({ where: { viagemId } });
    return resultado.count;
  }

  private paraDados(dados: DadosLocal) {
    return {
      viagemId: dados.viagemId,
      nome: dados.nome,
      endereco: dados.endereco ?? null,
      cidade: dados.cidade ?? null,
      categoria: dados.categoria ?? null,
      horarioPrevisto: dados.horarioPrevisto ?? null,
      horarioFim: dados.horarioFim ?? null,
      horarioAbertura: dados.horarioAbertura ?? null,
      horarioFechamento: dados.horarioFechamento ?? null,
      duracaoMin: dados.duracaoEstimada ?? null,
      custoCentavos: paraCentavos(dados.custo),
      observacoes: dados.observacoes ?? null,
      fotoUrl: dados.fotoUrl ?? null,
      lat: dados.lat ?? null,
      lng: dados.lng ?? null,
      geoStatus: dados.geoStatus ?? null,
    };
  }

  private paraModelo(local: LinhaLocal): Local {
    return {
      id: local.id,
      viagemId: local.viagemId,
      nome: local.nome,
      endereco: local.endereco,
      cidade: local.cidade,
      categoria: local.categoria,
      horarioPrevisto: local.horarioPrevisto,
      horarioFim: local.horarioFim,
      horarioAbertura: local.horarioAbertura,
      horarioFechamento: local.horarioFechamento,
      duracaoEstimada: local.duracaoMin,
      custo: deCentavos(local.custoCentavos),
      observacoes: local.observacoes,
      fotoUrl: local.fotoUrl,
      lat: local.lat,
      lng: local.lng,
      geoStatus: local.geoStatus,
    };
  }
}
