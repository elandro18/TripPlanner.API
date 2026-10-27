import { Inject, Injectable } from '@nestjs/common';
import { DestinoNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { DiaNaoEncontradoError } from '../../common/errors/dominio.error';
import { adicionarDias } from '../../common/utils/datas';
import { DESTINOS_REPOSITORY, DestinosRepository } from '../destinos/destinos.repository';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { AtualizarDiaDto, CriarDiaDto } from './dto/dia.dto';
import { DiaResponse, paraDiaResponse } from './dto/viagem-response';
import { DIAS_REPOSITORY, DiasRepository } from './dias.repository';
import { Dia } from './dia.model';
import { Viagem } from './viagem.model';

/** Dias da viagem (colunas do Kanban — RN-008, RN-009, RN-034). */
@Injectable()
export class DiasService {
  constructor(
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(DIAS_REPOSITORY) private readonly dias: DiasRepository,
    @Inject(DESTINOS_REPOSITORY) private readonly destinos: DestinosRepository,
  ) {}

  async listarPorViagem(viagemId: number, usuarioId: number): Promise<DiaResponse[]> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const dias = await this.dias.listarPorViagem(viagem.id);
    return dias.map(paraDiaResponse);
  }

  async buscar(id: number, usuarioId: number): Promise<DiaResponse> {
    const dia = await this.diaDoUsuario(id, usuarioId);
    return paraDiaResponse(dia);
  }

  /** Cria um dia manualmente (viagem sem datas ou dia extra no período). */
  async criar(viagemId: number, dto: CriarDiaDto, usuarioId: number): Promise<DiaResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    await this.validarDestino(dto.destinoId, viagem.id);

    const existentes = await this.dias.listarPorViagem(viagem.id);
    const numeroDia = existentes.length
      ? Math.max(...existentes.map((dia) => dia.numeroDia)) + 1
      : 1;

    let data: string | null = null;
    if (viagem.comDatas) {
      const ultimaData =
        existentes[existentes.length - 1]?.data ?? viagem.dataInicio;
      data = dto.data ?? (ultimaData ? adicionarDias(ultimaData, 1) : null);
      if (data && viagem.dataFim && data > viagem.dataFim) {
        await this.estenderPeriodo(viagem, data);
      }
    }

    const dia = await this.dias.criar(viagem.id, numeroDia, data);
    if (dto.titulo !== undefined || dto.destinoId !== undefined) {
      return paraDiaResponse(
        await this.dias.atualizar(dia.id, {
          titulo: dto.titulo ?? null,
          destinoId: dto.destinoId ?? null,
        }),
      );
    }
    return paraDiaResponse(dia);
  }

  async atualizar(id: number, dto: AtualizarDiaDto, usuarioId: number): Promise<DiaResponse> {
    const dia = await this.diaDoUsuario(id, usuarioId);
    await this.validarDestino(dto.destinoId, dia.viagemId);

    const atualizado = await this.dias.atualizar(dia.id, {
      numeroDia: dto.numeroDia,
      data: dto.data,
      titulo: dto.titulo,
      destinoId: dto.destinoId,
    });

    if (atualizado.data) {
      const viagem = await this.viagens.buscarPorId(atualizado.viagemId);
      if (viagem?.comDatas && viagem.dataFim && atualizado.data > viagem.dataFim) {
        await this.estenderPeriodo(viagem, atualizado.data);
      }
    }

    return paraDiaResponse(atualizado);
  }

  /** Exclui o dia (cards em cascata) e renumera/reassina as datas restantes. */
  async excluir(id: number, usuarioId: number): Promise<void> {
    const dia = await this.diaDoUsuario(id, usuarioId);
    const viagem = await this.viagens.buscarPorId(dia.viagemId);

    await this.dias.excluir(dia.id);

    if (!viagem) {
      return;
    }

    const restantes = await this.dias.listarPorViagem(viagem.id);
    for (const [indice, restante] of restantes.entries()) {
      const numeroDia = indice + 1;
      const data =
        viagem.comDatas && viagem.dataInicio
          ? adicionarDias(viagem.dataInicio, indice)
          : restante.data;
      if (restante.numeroDia !== numeroDia || restante.data !== data) {
        await this.dias.atualizar(restante.id, { numeroDia, data });
      }
    }

    if (viagem.comDatas && restantes.length > 0) {
      const ultimaData = adicionarDias(viagem.dataInicio as string, restantes.length - 1);
      if (viagem.dataFim !== ultimaData) {
        await this.viagens.atualizar(viagem.id, {
          usuarioId: viagem.usuarioId,
          nome: viagem.nome,
          destino: viagem.destino,
          comDatas: true,
          dataInicio: viagem.dataInicio,
          dataFim: ultimaData,
          moeda: viagem.moeda,
          ativa: viagem.ativa,
          capaUrl: viagem.capaUrl,
        });
      }
    }
  }

  private async diaDoUsuario(id: number, usuarioId: number): Promise<Dia> {
    const dia = await this.dias.buscarPorId(id);
    if (!dia) {
      throw new DiaNaoEncontradoError();
    }
    await exigirViagemDoUsuario(
      this.viagens,
      dia.viagemId,
      usuarioId,
      () => new DiaNaoEncontradoError(),
    );
    return dia;
  }

  private async validarDestino(
    destinoId: number | null | undefined,
    viagemId: number,
  ): Promise<void> {
    if (destinoId === undefined || destinoId === null) {
      return;
    }
    const destino = await this.destinos.buscarPorId(destinoId);
    if (!destino || destino.viagemId !== viagemId) {
      throw new DestinoNaoEncontradoError();
    }
  }

  private async estenderPeriodo(viagem: Viagem, novaDataFim: string): Promise<void> {
    await this.viagens.atualizar(viagem.id, {
      usuarioId: viagem.usuarioId,
      nome: viagem.nome,
      destino: viagem.destino,
      comDatas: true,
      dataInicio: viagem.dataInicio,
      dataFim: novaDataFim,
      moeda: viagem.moeda,
      ativa: viagem.ativa,
      capaUrl: viagem.capaUrl,
    });
  }
}
