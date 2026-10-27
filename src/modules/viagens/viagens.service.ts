import { Inject, Injectable } from '@nestjs/common';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { paginar, RespostaPaginada } from '../../common/dto/resposta-paginada';
import { DataFimInvalidaError } from '../../common/errors/dominio.error';
import { HoteisRepository, HOTEL_REPOSITORY } from '../hoteis/hoteis.repository';
import { LocaisRepository, LOCAIS_REPOSITORY } from '../locais/locais.repository';
import { PassagensRepository, PASSAGEM_REPOSITORY } from '../passagens/passagens.repository';
import {
  VINCULOS_ROTEIRO_REPOSITORY,
  VinculosRoteiroRepository,
} from '../roteiro/vinculos-roteiro.repository';
import { DIAS_REPOSITORY, DiasRepository } from './dias.repository';
import { AtualizarViagemDto, CriarViagemDto } from './dto/viagem.dto';
import { paraViagemResponse, ResumoViagemResponse, ViagemResponse } from './dto/viagem-response';
import { exigirViagemDoUsuario } from './viagem-acesso';
import { MOEDA_PADRAO, Viagem, datasDoPeriodo } from './viagem.model';
import { VIAGENS_REPOSITORY, ViagensRepository } from './viagens.repository';

/**
 * CRUD de viagem (RN-005, RN-006, RN-007) com geração automática dos dias
 * quando há período (RN-034) e dias manuais quando não há datas.
 */
@Injectable()
export class ViagensService {
  constructor(
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(DIAS_REPOSITORY) private readonly dias: DiasRepository,
    @Inject(LOCAIS_REPOSITORY) private readonly locais: LocaisRepository,
    @Inject(PASSAGEM_REPOSITORY) private readonly passagens: PassagensRepository,
    @Inject(HOTEL_REPOSITORY) private readonly hoteis: HoteisRepository,
    @Inject(VINCULOS_ROTEIRO_REPOSITORY) private readonly vinculos: VinculosRoteiroRepository,
  ) {}

  /** Lista paginada (offset) das viagens do usuário autenticado (RN-004). */
  async listar(
    usuarioId: number,
    paginacao: PaginacaoQueryDto,
  ): Promise<RespostaPaginada<ViagemResponse>> {
    const viagens = await this.viagens.listarPorUsuario(usuarioId);
    return paginar(viagens.map(paraViagemResponse), paginacao.page, paginacao.size);
  }

  async buscar(id: number, usuarioId: number): Promise<ViagemResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, id, usuarioId);
    return paraViagemResponse(viagem);
  }

  /** Resumo da viagem: contagens, progresso e orçamento previsto. */
  async resumo(id: number, usuarioId: number): Promise<ResumoViagemResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, id, usuarioId);
    const [dias, locais, passagens, hoteis, roteiro] = await Promise.all([
      this.dias.listarPorViagem(viagem.id),
      this.locais.listarPorViagem(viagem.id),
      this.passagens.listarPorViagem(viagem.id),
      this.hoteis.listarPorViagem(viagem.id),
      this.vinculos.listarPorViagem(viagem.id),
    ]);

    const organizados = new Set(
      roteiro.map((card) => `${card.tipoItem}:${card.itemId}`),
    );
    const contaLocais = locais.filter((local) => organizados.has(`LOCAL:${local.id}`)).length;
    const contaPassagens = passagens.filter((passagem) =>
      organizados.has(`PASSAGEM:${passagem.id}`),
    ).length;
    const contaHoteis = hoteis.filter((hotel) => organizados.has(`HOTEL:${hotel.id}`)).length;

    const totalItens = locais.length + passagens.length + hoteis.length;
    const itensOrganizados = contaLocais + contaPassagens + contaHoteis;

    const orcamentoLocais = locais.reduce((soma, local) => soma + (local.custo ?? 0), 0);
    const orcamentoPassagens = passagens.reduce(
      (soma, passagem) => soma + (passagem.valor ?? 0),
      0,
    );
    const orcamentoHoteis = hoteis.reduce(
      (soma, hotel) =>
        soma +
        (hotel.valorTotal ??
          (hotel.valorNoite !== null && hotel.noites !== null
            ? hotel.valorNoite * hotel.noites
            : 0)),
      0,
    );

    return {
      dias: dias.length,
      locais: locais.length,
      passagens: passagens.length,
      hoteis: hoteis.length,
      totalItens,
      itensOrganizados,
      progresso: totalItens ? Math.round((itensOrganizados / totalItens) * 100) : 0,
      orcamento: {
        locais: orcamentoLocais,
        passagens: orcamentoPassagens,
        hoteis: orcamentoHoteis,
        total: orcamentoLocais + orcamentoPassagens + orcamentoHoteis,
      },
    };
  }

  /**
   * RN-005 (registra nome, destino, período/moeda) + RN-006 (no máximo uma
   * viagem ativa) + RN-034 (dias gerados do período).
   *
   * A nova viagem nasce ativa e desativa as anteriores do mesmo usuário.
   */
  async criar(dto: CriarViagemDto, usuarioId: number): Promise<ViagemResponse> {
    const comDatas = dto.comDatas ?? Boolean(dto.dataInicio && dto.dataFim);
    const dataInicio = comDatas ? (dto.dataInicio ?? null) : null;
    const dataFim = comDatas ? (dto.dataFim ?? null) : null;
    this.validarPeriodo(comDatas, dataInicio, dataFim);

    await this.viagens.desativarDoUsuario(usuarioId);
    const viagem = await this.viagens.criar({
      usuarioId,
      nome: dto.nome.trim(),
      destino: dto.destino.trim(),
      comDatas,
      dataInicio,
      dataFim,
      moeda: dto.moeda ?? MOEDA_PADRAO,
      ativa: true,
      capaUrl: dto.capaUrl?.trim() ?? '',
    });

    await this.sincronizarDias(viagem);
    return paraViagemResponse(viagem);
  }

  /** RN-007 (editar) — alterar período/datas regenera os dias (RN-034). */
  async atualizar(id: number, dto: AtualizarViagemDto, usuarioId: number): Promise<ViagemResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, id, usuarioId);
    const comDatas = dto.comDatas ?? viagem.comDatas;
    const dataInicio = comDatas ? (dto.dataInicio ?? null) : null;
    const dataFim = comDatas ? (dto.dataFim ?? null) : null;
    this.validarPeriodo(comDatas, dataInicio, dataFim);

    const atualizada = await this.viagens.atualizar(viagem.id, {
      usuarioId,
      nome: dto.nome.trim(),
      destino: dto.destino.trim(),
      comDatas,
      dataInicio,
      dataFim,
      moeda: dto.moeda ?? viagem.moeda,
      ativa: viagem.ativa,
      capaUrl: dto.capaUrl?.trim() ?? viagem.capaUrl,
    });

    await this.sincronizarDias(atualizada);
    return paraViagemResponse(atualizada);
  }

  /** Troca a viagem ativa do usuário (UI: "abrir viagem"). */
  async ativar(id: number, usuarioId: number): Promise<ViagemResponse> {
    await exigirViagemDoUsuario(this.viagens, id, usuarioId);
    await this.viagens.desativarDoUsuario(usuarioId, id);
    const viagem = await this.viagens.ativar(id);
    return paraViagemResponse(viagem);
  }

  /** RN-007 (excluir) — remove a viagem e os dados vinculados. */
  async excluir(id: number, usuarioId: number): Promise<void> {
    const viagem = await exigirViagemDoUsuario(this.viagens, id, usuarioId);

    const dias = await this.dias.excluirPorViagem(viagem.id);
    await this.vinculos.excluirPorDias(dias.map((dia) => dia.id));
    await this.locais.excluirPorViagem(viagem.id);
    await this.passagens.excluirPorViagem(viagem.id);
    await this.hoteis.excluirPorViagem(viagem.id);
    await this.viagens.excluir(viagem.id);
  }

  /**
   * Ajusta os dias da viagem ao período (RN-034) ou limpa as datas quando a
   * viagem deixa de ter período.
   *
   * - Com datas: garante um dia por data, reaproveitando dias existentes (por
   *   data ou, na transição sem datas → com datas, por número) para não perder
   *   cards; remove os dias que saíram do período.
   * - Sem datas: mantém os dias e apenas zera as datas.
   */
  private async sincronizarDias(viagem: Viagem): Promise<void> {
    const existentes = await this.dias.listarPorViagem(viagem.id);

    if (!viagem.comDatas) {
      if (existentes.length === 0) {
        await this.dias.criar(viagem.id, 1, null);
        return;
      }
      for (const dia of existentes) {
        if (dia.data !== null) {
          await this.dias.atualizar(dia.id, { data: null });
        }
      }
      return;
    }

    const datasEsperadas = datasDoPeriodo(viagem.dataInicio, viagem.dataFim);
    const porData = new Map(
      existentes
        .filter((dia) => dia.data && datasEsperadas.includes(dia.data))
        .map((dia) => [dia.data as string, dia]),
    );
    const semData = existentes
      .filter((dia) => !dia.data)
      .sort((a, b) => a.numeroDia - b.numeroDia);
    const usados = new Set<number>();
    let proximo = 0;

    for (const [indice, data] of datasEsperadas.entries()) {
      const numeroDia = indice + 1;
      const existente = porData.get(data);
      if (existente) {
        usados.add(existente.id);
        if (existente.numeroDia !== numeroDia) {
          await this.dias.atualizarNumero(existente.id, numeroDia);
        }
        continue;
      }

      const reaproveitado = semData[proximo++];
      if (reaproveitado) {
        usados.add(reaproveitado.id);
        await this.dias.atualizar(reaproveitado.id, { numeroDia, data });
      } else {
        await this.dias.criar(viagem.id, numeroDia, data);
      }
    }

    const remover = existentes.filter((dia) => !usados.has(dia.id));
    if (remover.length > 0) {
      await this.vinculos.excluirPorDias(remover.map((dia) => dia.id));
      for (const dia of remover) {
        await this.dias.excluir(dia.id);
      }
    }
  }

  /** RN-005 — período válido: fim >= início e extensão razoável. */
  private validarPeriodo(
    comDatas: boolean,
    dataInicio: string | null,
    dataFim: string | null,
  ): void {
    if (!comDatas) {
      return;
    }
    if (
      !dataInicio ||
      !dataFim ||
      dataFim < dataInicio ||
      datasDoPeriodo(dataInicio, dataFim).length === 0
    ) {
      throw new DataFimInvalidaError();
    }
  }
}
