import { Inject, Injectable } from '@nestjs/common';
import {
  ItemListaNaoEncontradoError,
  ListaNaoEncontradaError,
} from '../../common/errors/dominio-extras.error';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import {
  AtualizarListaDto,
  AtualizarListaItemDto,
  CriarListaDto,
  CriarListaItemDto,
} from './dto/lista.dto';
import {
  ListaItemResponse,
  ListaResponse,
  paraListaItemResponse,
  paraListaResponse,
} from './dto/lista-response';
import { DadosListaItem, Lista, ListaItem } from './lista.model';
import { LISTAS_REPOSITORY, ListasRepository } from './listas.repository';

/** Ordena pendentes por `ordem` e concluídos pela data de conclusão. */
function ordenarItens(itens: ListaItem[]): ListaItem[] {
  const pendentes = itens
    .filter((item) => !item.concluido)
    .sort((a, b) => a.ordem - b.ordem);
  const concluidos = itens
    .filter((item) => item.concluido)
    .sort((a, b) => {
      const ca = a.concluidoEm ?? '';
      const cb = b.concluidoEm ?? '';
      return ca === cb ? a.ordem - b.ordem : ca.localeCompare(cb);
    });
  return [...pendentes, ...concluidos];
}

/** Listas/checklists com isolamento por usuário. */
@Injectable()
export class ListasService {
  constructor(
    @Inject(LISTAS_REPOSITORY) private readonly listas: ListasRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
  ) {}

  async listar(usuarioId: number, viagemId?: number): Promise<ListaResponse[]> {
    const listas = await this.listas.listarPorUsuario(usuarioId, viagemId);
    return listas.map(paraListaResponse);
  }

  async buscar(id: number, usuarioId: number): Promise<ListaResponse> {
    const lista = await this.listaDoUsuario(id, usuarioId);
    return paraListaResponse(lista);
  }

  async criar(dto: CriarListaDto, usuarioId: number): Promise<ListaResponse> {
    if (dto.viagemId !== undefined) {
      await exigirViagemDoUsuario(this.viagens, dto.viagemId, usuarioId);
    }
    const lista = await this.listas.criar({
      usuarioId,
      viagemId: dto.viagemId ?? null,
      nome: dto.nome.trim(),
      categoria: dto.categoria?.trim() || 'Outros',
    });
    return paraListaResponse(lista);
  }

  async atualizar(id: number, dto: AtualizarListaDto, usuarioId: number): Promise<ListaResponse> {
    const lista = await this.listaDoUsuario(id, usuarioId);
    if (dto.viagemId !== undefined && dto.viagemId !== null) {
      await exigirViagemDoUsuario(this.viagens, dto.viagemId, usuarioId);
    }
    const atualizada = await this.listas.atualizar(lista.id, {
      usuarioId,
      nome: dto.nome?.trim() ?? lista.nome,
      categoria: dto.categoria?.trim() ?? lista.categoria,
      viagemId: dto.viagemId === undefined ? lista.viagemId : dto.viagemId,
    });
    return paraListaResponse(atualizada);
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    const lista = await this.listaDoUsuario(id, usuarioId);
    await this.listas.excluir(lista.id);
  }

  async listarItens(listaId: number, usuarioId: number): Promise<ListaItemResponse[]> {
    const lista = await this.listaDoUsuario(listaId, usuarioId);
    const itens = await this.listas.listarItens(lista.id);
    return ordenarItens(itens).map(paraListaItemResponse);
  }

  async criarItem(
    listaId: number,
    dto: CriarListaItemDto,
    usuarioId: number,
  ): Promise<ListaItemResponse> {
    const lista = await this.listaDoUsuario(listaId, usuarioId);
    const itens = await this.listas.listarItens(lista.id);
    const ordem = dto.ordem ?? (itens.length ? Math.max(...itens.map((item) => item.ordem)) + 1 : 0);

    const item = await this.listas.criarItem({
      listaId: lista.id,
      nome: dto.nome.trim(),
      tipo: dto.tipo?.trim() ?? null,
      valor: dto.valor,
      valorPrevisto: dto.valorPrevisto,
      valorPago: dto.valorPago,
      pagoEm: dto.pagoEm ?? null,
      concluido: dto.concluido ?? false,
      concluidoEm: dto.concluido ? (dto.concluidoEm ?? new Date().toISOString()) : null,
      ordem,
      fotoUrl: dto.fotoUrl ?? null,
      refeicao: dto.refeicao ?? false,
      endereco: dto.endereco?.trim() ?? null,
      cidade: dto.cidade?.trim() ?? null,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      fotoPratoUrl: dto.fotoPratoUrl ?? null,
      fotoLocalUrl: dto.fotoLocalUrl ?? null,
      observacoes: dto.observacoes?.trim() ?? null,
    });
    return paraListaItemResponse(item);
  }

  async atualizarItem(
    itemId: number,
    dto: AtualizarListaItemDto,
    usuarioId: number,
  ): Promise<ListaItemResponse> {
    const item = await this.itemDoUsuario(itemId, usuarioId);
    const dados: Partial<DadosListaItem> = {
      nome: dto.nome?.trim(),
      tipo: dto.tipo === undefined ? undefined : (dto.tipo?.trim() ?? null),
      valor: dto.valor,
      valorPrevisto: dto.valorPrevisto,
      valorPago: dto.valorPago,
      pagoEm: dto.pagoEm,
      ordem: dto.ordem,
      fotoUrl: dto.fotoUrl,
      refeicao: dto.refeicao,
      endereco: dto.endereco === undefined ? undefined : (dto.endereco?.trim() ?? null),
      cidade: dto.cidade === undefined ? undefined : (dto.cidade?.trim() ?? null),
      lat: dto.lat,
      lng: dto.lng,
      fotoPratoUrl: dto.fotoPratoUrl,
      fotoLocalUrl: dto.fotoLocalUrl,
      observacoes:
        dto.observacoes === undefined ? undefined : (dto.observacoes?.trim() ?? null),
    };

    if (dto.concluido !== undefined) {
      dados.concluido = dto.concluido;
      dados.concluidoEm = dto.concluido
        ? (dto.concluidoEm ?? new Date().toISOString())
        : null;
    } else if (dto.concluidoEm !== undefined) {
      dados.concluidoEm = dto.concluidoEm;
    }

    const atualizado = await this.listas.atualizarItem(item.id, dados);
    return paraListaItemResponse(atualizado);
  }

  async excluirItem(itemId: number, usuarioId: number): Promise<void> {
    const item = await this.itemDoUsuario(itemId, usuarioId);
    await this.listas.excluirItem(item.id);
  }

  async reordenarItens(
    listaId: number,
    ordens: Array<{ id: number; ordem: number }>,
    usuarioId: number,
  ): Promise<ListaItemResponse[]> {
    const lista = await this.listaDoUsuario(listaId, usuarioId);
    const itens = await this.listas.listarItens(lista.id);
    const permitidos = new Set(itens.map((item) => item.id));
    if (ordens.some(({ id }) => !permitidos.has(id))) {
      throw new ItemListaNaoEncontradoError();
    }
    await this.listas.reordenarItens(lista.id, ordens);
    const reordenados = await this.listas.listarItens(lista.id);
    return ordenarItens(reordenados).map(paraListaItemResponse);
  }

  private async listaDoUsuario(id: number, usuarioId: number): Promise<Lista> {
    const lista = await this.listas.buscarPorId(id);
    if (!lista) {
      throw new ListaNaoEncontradaError();
    }
    if (lista.usuarioId !== usuarioId) {
      throw new ListaNaoEncontradaError();
    }
    return lista;
  }

  private async itemDoUsuario(itemId: number, usuarioId: number): Promise<ListaItem> {
    const item = await this.listas.buscarItemPorId(itemId);
    if (!item) {
      throw new ItemListaNaoEncontradoError();
    }
    await this.listaDoUsuario(item.listaId, usuarioId);
    return item;
  }
}
