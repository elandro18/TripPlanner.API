import { Inject, Injectable } from '@nestjs/common';
import { CardNaoEncontradoError, HorarioInvalidoError } from '../../common/errors/dominio-extras.error';
import {
  ConflitoHorarioError,
  ItemJaNoDiaError,
  ItemNaoPertenceAViagemError,
} from '../../common/errors/dominio.error';
import { HoteisRepository, HOTEL_REPOSITORY } from '../hoteis/hoteis.repository';
import { Hotel } from '../hoteis/hotel.model';
import { LocaisRepository, LOCAIS_REPOSITORY } from '../locais/locais.repository';
import { Local } from '../locais/local.model';
import { PassagensRepository, PASSAGEM_REPOSITORY } from '../passagens/passagens.repository';
import { Passagem } from '../passagens/passagem.model';
import { DIAS_REPOSITORY, DiasRepository } from '../viagens/dias.repository';
import { Dia } from '../viagens/dia.model';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { AtualizarRoteiroDto, CriarRoteiroDto } from './dto/roteiro.dto';
import { paraRoteiroResponse, RoteiroResponse } from './dto/roteiro-response';
import { Roteiro, TipoItemRoteiro } from './roteiro.model';
import {
  VINCULOS_ROTEIRO_REPOSITORY,
  VinculosRoteiroRepository,
} from './vinculos-roteiro.repository';

type ItemRoteiro =
  | { tipo: 'LOCAL'; item: Local }
  | { tipo: 'PASSAGEM'; item: Passagem }
  | { tipo: 'HOTEL'; item: Hotel };

function minutos(hhmm: string | null | undefined): number | null {
  if (!hhmm) {
    return null;
  }
  const partes = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!partes) {
    return null;
  }
  return Number(partes[1]) * 60 + Number(partes[2]);
}

function horaDeIso(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const partes = /T(\d{2}:\d{2})/.exec(iso);
  return partes ? partes[1] : null;
}

/** CRUD do roteiro (cards) — RN-019 a RN-022. */
@Injectable()
export class RoteiroService {
  constructor(
    @Inject(VINCULOS_ROTEIRO_REPOSITORY)
    private readonly cards: VinculosRoteiroRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(DIAS_REPOSITORY) private readonly dias: DiasRepository,
    @Inject(LOCAIS_REPOSITORY) private readonly locais: LocaisRepository,
    @Inject(PASSAGEM_REPOSITORY) private readonly passagens: PassagensRepository,
    @Inject(HOTEL_REPOSITORY) private readonly hoteis: HoteisRepository,
  ) {}

  async listarPorViagem(viagemId: number, usuarioId: number): Promise<RoteiroResponse[]> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const cards = await this.cards.listarPorViagem(viagem.id);
    return cards.map(paraRoteiroResponse);
  }

  async criar(diaId: number, dto: CriarRoteiroDto, usuarioId: number): Promise<RoteiroResponse> {
    const dia = await this.diaDoUsuario(diaId, usuarioId);
    const referencia = await this.itemDaViagem(dto.tipo, dto.itemId, dia.viagemId);
    const cards = await this.cards.listarPorDia(dia.id);

    if (cards.some((card) => card.tipoItem === dto.tipo && card.itemId === dto.itemId)) {
      throw new ItemJaNoDiaError();
    }

    const horario = this.resolverHorario(dto.horarioInicio, dto.horarioFim, referencia);
    await this.validarConflito(dia.id, horario, referencia, undefined);

    const ordem = cards.length ? Math.max(...cards.map((card) => card.ordem)) + 1 : 0;
    const card = await this.cards.criar({
      viagemId: dia.viagemId,
      diaId: dia.id,
      tipoItem: dto.tipo,
      itemId: dto.itemId,
      ordem,
      inicio: horario.inicio,
      fim: horario.fim,
    });
    return paraRoteiroResponse(card);
  }

  async atualizar(
    id: number,
    dto: AtualizarRoteiroDto,
    usuarioId: number,
  ): Promise<RoteiroResponse> {
    const card = await this.cardDoUsuario(id, usuarioId);
    const referencia = await this.itemDaViagem(card.tipoItem, card.itemId, card.viagemId);
    const diaId = dto.diaId ?? card.diaId;

    if (diaId !== card.diaId) {
      const alvo = await this.diaDoUsuario(diaId, usuarioId);
      if (alvo.viagemId !== card.viagemId) {
        throw new ItemNaoPertenceAViagemError();
      }
      const cardsAlvo = await this.cards.listarPorDia(alvo.id);
      if (
        cardsAlvo.some(
          (outro) =>
            outro.id !== card.id &&
            outro.tipoItem === card.tipoItem &&
            outro.itemId === card.itemId,
        )
      ) {
        throw new ItemJaNoDiaError();
      }
    }

    const inicio = dto.horarioInicio === undefined ? card.inicio : dto.horarioInicio;
    const fim = dto.horarioFim === undefined ? card.fim : dto.horarioFim;
    const horario = this.resolverHorario(inicio, fim, referencia);
    if (horario.inicio) {
      await this.validarConflito(diaId, horario, referencia, card.id);
    }

    const atualizado = await this.cards.atualizar(card.id, {
      diaId: dto.diaId,
      ordem: dto.ordem,
      inicio: horario.inicio,
      fim: horario.fim,
      concluido: dto.concluido,
      concluidoEm:
        dto.concluido === undefined ? undefined : dto.concluido ? new Date().toISOString() : null,
    });
    return paraRoteiroResponse(atualizado);
  }

  async reordenar(
    diaId: number,
    ordens: Array<{ id: number; ordem: number }>,
    usuarioId: number,
  ): Promise<RoteiroResponse[]> {
    const dia = await this.diaDoUsuario(diaId, usuarioId);
    const cards = await this.cards.listarPorDia(dia.id);
    const permitidos = new Set(cards.map((card) => card.id));
    if (ordens.some(({ id }) => !permitidos.has(id))) {
      throw new CardNaoEncontradoError();
    }
    await this.cards.reordenar(dia.id, ordens);
    const reordenados = await this.cards.listarPorDia(dia.id);
    return reordenados.map(paraRoteiroResponse);
  }

  async excluir(id: number, usuarioId: number): Promise<void> {
    const card = await this.cardDoUsuario(id, usuarioId);
    await this.cards.excluir(card.id);
  }

  private async diaDoUsuario(diaId: number, usuarioId: number): Promise<Dia> {
    const dia = await this.dias.buscarPorId(diaId);
    if (!dia) {
      throw new CardNaoEncontradoError();
    }
    await exigirViagemDoUsuario(
      this.viagens,
      dia.viagemId,
      usuarioId,
      () => new CardNaoEncontradoError(),
    );
    return dia;
  }

  private async cardDoUsuario(id: number, usuarioId: number): Promise<Roteiro> {
    const card = await this.cards.buscarPorId(id);
    if (!card) {
      throw new CardNaoEncontradoError();
    }
    await exigirViagemDoUsuario(
      this.viagens,
      card.viagemId,
      usuarioId,
      () => new CardNaoEncontradoError(),
    );
    return card;
  }

  private async itemDaViagem(
    tipo: TipoItemRoteiro,
    itemId: number,
    viagemId: number,
  ): Promise<ItemRoteiro> {
    if (tipo === 'LOCAL') {
      const item = await this.locais.buscarPorId(itemId);
      if (!item || item.viagemId !== viagemId) {
        throw new ItemNaoPertenceAViagemError();
      }
      return { tipo, item };
    }
    if (tipo === 'PASSAGEM') {
      const item = await this.passagens.buscarPorId(itemId);
      if (!item || item.viagemId !== viagemId) {
        throw new ItemNaoPertenceAViagemError();
      }
      return { tipo, item };
    }
    const item = await this.hoteis.buscarPorId(itemId);
    if (!item || item.viagemId !== viagemId) {
      throw new ItemNaoPertenceAViagemError();
    }
    return { tipo: 'HOTEL', item };
  }

  /** Horário do card: o informado tem precedência; senão, o natural do item. */
  private resolverHorario(
    inicioInformado: string | null | undefined,
    fimInformado: string | null | undefined,
    referencia: ItemRoteiro,
  ): { inicio: string | null; fim: string | null } {
    const natural = this.horarioNatural(referencia);
    const inicio = inicioInformado === undefined ? natural.inicio : inicioInformado;
    let fim = fimInformado === undefined ? natural.fim : fimInformado;

    if (inicio && fim === null && natural.inicio === inicio) {
      fim = natural.fim;
    }

    if (inicio && fim) {
      const i = minutos(inicio);
      const f = minutos(fim);
      if (i === null || f === null || f <= i) {
        throw new HorarioInvalidoError();
      }
    }
    return { inicio: inicio ?? null, fim: fim ?? null };
  }

  private horarioNatural(referencia: ItemRoteiro): {
    inicio: string | null;
    fim: string | null;
  } {
    if (referencia.tipo === 'LOCAL') {
      const inicio = referencia.item.horarioPrevisto;
      const inicioMin = minutos(inicio);
      let fim = referencia.item.horarioFim ?? null;
      if (!fim && inicioMin !== null && referencia.item.duracaoEstimada) {
        const total = inicioMin + referencia.item.duracaoEstimada;
        fim = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      }
      return { inicio: inicio ?? null, fim };
    }
    if (referencia.tipo === 'PASSAGEM') {
      const inicio = horaDeIso(referencia.item.dataHoraPartida);
      const chegada = horaDeIso(referencia.item.dataHoraChegada);
      const inicioMin = minutos(inicio);
      const chegadaMin = minutos(chegada);
      const fim =
        inicioMin !== null && chegadaMin !== null && chegadaMin > inicioMin ? chegada : null;
      return { inicio, fim };
    }
    return { inicio: null, fim: null };
  }

  private async validarConflito(
    diaId: number,
    horario: { inicio: string | null; fim: string | null },
    referencia: ItemRoteiro,
    ignorarId: number | undefined,
  ): Promise<void> {
    const inicio = minutos(horario.inicio);
    if (inicio === null) {
      return;
    }
    const natural = this.horarioNatural(referencia);
    const fim =
      minutos(horario.fim) ??
      (natural.inicio === horario.inicio ? minutos(natural.fim) : null);
    if (fim === null || fim <= inicio) {
      return;
    }

    const cards = await this.cards.listarPorDia(diaId);
    for (const card of cards) {
      if (card.id === ignorarId || card.tipoItem === 'HOTEL') {
        continue;
      }
      const outroInicio = minutos(card.inicio);
      if (outroInicio === null) {
        continue;
      }
      const outroFim = await this.fimDoCard(card, outroInicio);
      if (outroFim === null || outroFim <= outroInicio) {
        continue;
      }
      if (inicio < outroFim && outroInicio < fim) {
        throw new ConflitoHorarioError();
      }
    }
  }

  private async fimDoCard(card: Roteiro, inicio: number): Promise<number | null> {
    const fim = minutos(card.fim);
    if (fim !== null) {
      return fim;
    }
    const referencia = await this.itemDaViagem(card.tipoItem, card.itemId, card.viagemId);
    const natural = this.horarioNatural(referencia);
    const fimNatural = minutos(natural.fim);
    if (fimNatural !== null && fimNatural > inicio) {
      return fimNatural;
    }
    return null;
  }
}
