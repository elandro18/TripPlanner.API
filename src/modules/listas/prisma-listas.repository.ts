import { Injectable } from '@nestjs/common';
import {
  ItemListaNaoEncontradoError,
  ListaNaoEncontradaError,
} from '../../common/errors/dominio-extras.error';
import { deCentavos, paraCentavos } from '../../common/utils/dinheiro';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import {
  DadosLista,
  DadosListaItem,
  Lista,
  ListaItem,
} from './lista.model';
import { ListasRepository } from './listas.repository';

interface LinhaLista {
  readonly id: number;
  readonly usuarioId: number;
  readonly viagemId: number | null;
  readonly nome: string;
  readonly categoria: string;
  readonly criadaEm: Date;
}

interface LinhaListaItem {
  readonly id: number;
  readonly listaId: number;
  readonly nome: string;
  readonly tipo: string | null;
  readonly valorCentavos: number | null;
  readonly valorPrevistoCentavos: number | null;
  readonly valorPagoCentavos: number | null;
  readonly pagoEm: Date | null;
  readonly concluido: boolean;
  readonly concluidoEm: Date | null;
  readonly ordem: number;
  readonly criadaEm: Date;
  readonly fotoUrl: string | null;
  readonly refeicao: boolean;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly fotoPratoUrl: string | null;
  readonly fotoLocalUrl: string | null;
  readonly observacoes: string | null;
}

/** Adaptador Prisma de listas/checklists. */
@Injectable()
export class PrismaListasRepository implements ListasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorUsuario(usuarioId: number, viagemId?: number | null): Promise<Lista[]> {
    const listas = await this.prisma.lista.findMany({
      where: {
        usuarioId,
        ...(viagemId === undefined ? {} : { viagemId }),
      },
      orderBy: { id: 'asc' },
    });
    return listas.map((lista) => this.paraLista(lista));
  }

  async buscarPorId(id: number): Promise<Lista | null> {
    const lista = await this.prisma.lista.findUnique({ where: { id } });
    return lista ? this.paraLista(lista) : null;
  }

  async criar(dados: DadosLista): Promise<Lista> {
    const lista = await this.prisma.lista.create({
      data: {
        usuarioId: dados.usuarioId,
        viagemId: dados.viagemId ?? null,
        nome: dados.nome,
        categoria: dados.categoria ?? 'Outros',
      },
    });
    return this.paraLista(lista);
  }

  async atualizar(id: number, dados: DadosLista): Promise<Lista> {
    try {
      const lista = await this.prisma.lista.update({
        where: { id },
        data: {
          nome: dados.nome,
          categoria: dados.categoria ?? 'Outros',
          viagemId: dados.viagemId ?? null,
        },
      });
      return this.paraLista(lista);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ListaNaoEncontradaError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.lista.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ListaNaoEncontradaError();
      }
      throw erro;
    }
  }

  async listarItens(listaId: number): Promise<ListaItem[]> {
    const itens = await this.prisma.listaItem.findMany({
      where: { listaId },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });
    return itens.map((item) => this.paraItem(item));
  }

  async buscarItemPorId(id: number): Promise<ListaItem | null> {
    const item = await this.prisma.listaItem.findUnique({ where: { id } });
    return item ? this.paraItem(item) : null;
  }

  async criarItem(dados: DadosListaItem): Promise<ListaItem> {
    const item = await this.prisma.listaItem.create({
      data: {
        listaId: dados.listaId,
        nome: dados.nome,
        tipo: dados.tipo ?? null,
        valorCentavos: paraCentavos(dados.valor),
        valorPrevistoCentavos: paraCentavos(dados.valorPrevisto),
        valorPagoCentavos: paraCentavos(dados.valorPago),
        pagoEm: dados.pagoEm ? new Date(dados.pagoEm) : null,
        concluido: dados.concluido ?? false,
        concluidoEm: dados.concluidoEm ? new Date(dados.concluidoEm) : null,
        ordem: dados.ordem ?? 0,
        fotoUrl: dados.fotoUrl ?? null,
        refeicao: dados.refeicao ?? false,
        endereco: dados.endereco ?? null,
        cidade: dados.cidade ?? null,
        lat: dados.lat ?? null,
        lng: dados.lng ?? null,
        fotoPratoUrl: dados.fotoPratoUrl ?? null,
        fotoLocalUrl: dados.fotoLocalUrl ?? null,
        observacoes: dados.observacoes ?? null,
      },
    });
    return this.paraItem(item);
  }

  async atualizarItem(id: number, dados: Partial<DadosListaItem>): Promise<ListaItem> {
    try {
      const item = await this.prisma.listaItem.update({
        where: { id },
        data: {
          ...(dados.nome === undefined ? {} : { nome: dados.nome }),
          ...(dados.tipo === undefined ? {} : { tipo: dados.tipo }),
          ...(dados.valor === undefined ? {} : { valorCentavos: paraCentavos(dados.valor) }),
          ...(dados.valorPrevisto === undefined
            ? {}
            : { valorPrevistoCentavos: paraCentavos(dados.valorPrevisto) }),
          ...(dados.valorPago === undefined
            ? {}
            : { valorPagoCentavos: paraCentavos(dados.valorPago) }),
          ...(dados.pagoEm === undefined
            ? {}
            : { pagoEm: dados.pagoEm ? new Date(dados.pagoEm) : null }),
          ...(dados.concluido === undefined ? {} : { concluido: dados.concluido }),
          ...(dados.concluidoEm === undefined
            ? {}
            : { concluidoEm: dados.concluidoEm ? new Date(dados.concluidoEm) : null }),
          ...(dados.ordem === undefined ? {} : { ordem: dados.ordem }),
          ...(dados.fotoUrl === undefined ? {} : { fotoUrl: dados.fotoUrl }),
          ...(dados.refeicao === undefined ? {} : { refeicao: dados.refeicao }),
          ...(dados.endereco === undefined ? {} : { endereco: dados.endereco }),
          ...(dados.cidade === undefined ? {} : { cidade: dados.cidade }),
          ...(dados.lat === undefined ? {} : { lat: dados.lat }),
          ...(dados.lng === undefined ? {} : { lng: dados.lng }),
          ...(dados.fotoPratoUrl === undefined ? {} : { fotoPratoUrl: dados.fotoPratoUrl }),
          ...(dados.fotoLocalUrl === undefined ? {} : { fotoLocalUrl: dados.fotoLocalUrl }),
          ...(dados.observacoes === undefined ? {} : { observacoes: dados.observacoes }),
        },
      });
      return this.paraItem(item);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ItemListaNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluirItem(id: number): Promise<void> {
    try {
      await this.prisma.listaItem.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new ItemListaNaoEncontradoError();
      }
      throw erro;
    }
  }

  async reordenarItens(
    listaId: number,
    ordens: Array<{ id: number; ordem: number }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      ordens.map(({ id, ordem }) =>
        this.prisma.listaItem.updateMany({ where: { id, listaId }, data: { ordem } }),
      ),
    );
  }

  private paraLista(lista: LinhaLista): Lista {
    return {
      id: lista.id,
      usuarioId: lista.usuarioId,
      viagemId: lista.viagemId,
      nome: lista.nome,
      categoria: lista.categoria,
      criadaEm: lista.criadaEm.toISOString(),
    };
  }

  private paraItem(item: LinhaListaItem): ListaItem {
    return {
      id: item.id,
      listaId: item.listaId,
      nome: item.nome,
      tipo: item.tipo,
      valor: deCentavos(item.valorCentavos),
      valorPrevisto: deCentavos(item.valorPrevistoCentavos),
      valorPago: deCentavos(item.valorPagoCentavos),
      pagoEm: item.pagoEm ? item.pagoEm.toISOString() : null,
      concluido: item.concluido,
      concluidoEm: item.concluidoEm ? item.concluidoEm.toISOString() : null,
      ordem: item.ordem,
      criadaEm: item.criadaEm.toISOString(),
      fotoUrl: item.fotoUrl,
      refeicao: item.refeicao,
      endereco: item.endereco,
      cidade: item.cidade,
      lat: item.lat,
      lng: item.lng,
      fotoPratoUrl: item.fotoPratoUrl,
      fotoLocalUrl: item.fotoLocalUrl,
      observacoes: item.observacoes,
    };
  }
}
