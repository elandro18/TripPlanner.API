import { Inject, Injectable } from '@nestjs/common';
import { DestinoNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { DataFimInvalidaError } from '../../common/errors/dominio.error';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { AtualizarDestinoDto, CriarDestinoDto } from './dto/destino.dto';
import { DestinoResponse, paraDestinoResponse } from './dto/destino-response';
import { DadosDestino } from './destino.model';
import { DESTINOS_REPOSITORY, DestinosRepository } from './destinos.repository';

/** CRUD de destinos com isolamento por dono da viagem (RN-004). */
@Injectable()
export class DestinosService {
  constructor(
    @Inject(DESTINOS_REPOSITORY) private readonly destinos: DestinosRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
  ) {}

  async listar(viagemId: number, usuarioId: number): Promise<DestinoResponse[]> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const destinos = await this.destinos.listarPorViagem(viagem.id);
    return destinos.map(paraDestinoResponse);
  }

  async buscar(id: number, usuarioId: number): Promise<DestinoResponse> {
    const destino = await this.destinoDoUsuario(id, usuarioId);
    return paraDestinoResponse(destino);
  }

  async criar(
    viagemId: number,
    dto: CriarDestinoDto,
    usuarioId: number,
  ): Promise<DestinoResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    this.validarPeriodo(dto);
    const existentes = await this.destinos.listarPorViagem(viagem.id);
    const ordem =
      dto.ordem ?? (existentes.length ? Math.max(...existentes.map((d) => d.ordem)) + 1 : 0);

    const destino = await this.destinos.criar({
      viagemId: viagem.id,
      nome: dto.nome.trim(),
      cidade: dto.cidade?.trim() ?? null,
      pais: dto.pais?.trim() ?? null,
      ordem,
      dataInicio: dto.dataInicio ?? null,
      dataFim: dto.dataFim ?? null,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
    });
    return paraDestinoResponse(destino);
  }

  async atualizar(
    id: number,
    dto: AtualizarDestinoDto,
    usuarioId: number,
  ): Promise<DestinoResponse> {
    const destino = await this.destinoDoUsuario(id, usuarioId);
    this.validarPeriodo(dto);

    const atualizado = await this.destinos.atualizar(destino.id, {
      viagemId: destino.viagemId,
      nome: dto.nome.trim(),
      cidade: dto.cidade?.trim() ?? null,
      pais: dto.pais?.trim() ?? null,
      ordem: dto.ordem,
      dataInicio: dto.dataInicio ?? null,
      dataFim: dto.dataFim ?? null,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
    });
    return paraDestinoResponse(atualizado);
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    const destino = await this.destinoDoUsuario(id, usuarioId);
    await this.destinos.excluir(destino.id);
  }

  async reordenar(
    viagemId: number,
    ids: number[],
    usuarioId: number,
  ): Promise<DestinoResponse[]> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const existentes = await this.destinos.listarPorViagem(viagem.id);
    const permitidos = new Set(existentes.map((destino) => destino.id));
    if (ids.some((id) => !permitidos.has(id))) {
      throw new DestinoNaoEncontradoError();
    }
    const reordenados = await this.destinos.reordenar(viagem.id, ids);
    return reordenados.map(paraDestinoResponse);
  }

  private validarPeriodo(dto: CriarDestinoDto): void {
    if (dto.dataInicio && dto.dataFim && dto.dataFim < dto.dataInicio) {
      throw new DataFimInvalidaError();
    }
  }

  private async destinoDoUsuario(id: number, usuarioId: number) {
    const destino = await this.destinos.buscarPorId(id);
    if (!destino) {
      throw new DestinoNaoEncontradoError();
    }
    await exigirViagemDoUsuario(
      this.viagens,
      destino.viagemId,
      usuarioId,
      () => new DestinoNaoEncontradoError(),
    );
    return destino;
  }
}
