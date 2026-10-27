import { Dia } from '../dia.model';
import { Moeda, Viagem } from '../viagem.model';

/** Viagem como exposta na API — sem o dono. */
export interface ViagemResponse {
  readonly id: number;
  readonly nome: string;
  readonly destino: string;
  readonly comDatas: boolean;
  readonly dataInicio: string | null;
  readonly dataFim: string | null;
  readonly moeda: Moeda;
  readonly ativa: boolean;
  readonly capaUrl: string;
  readonly criadaEm: string;
}

/** Dia como exposto na API. */
export interface DiaResponse {
  readonly id: number;
  readonly viagemId: number;
  readonly numeroDia: number;
  readonly data: string | null;
  readonly titulo: string | null;
  readonly destinoId: number | null;
}

export function paraViagemResponse(viagem: Viagem): ViagemResponse {
  return {
    id: viagem.id,
    nome: viagem.nome,
    destino: viagem.destino,
    comDatas: viagem.comDatas,
    dataInicio: viagem.dataInicio,
    dataFim: viagem.dataFim,
    moeda: viagem.moeda,
    ativa: viagem.ativa,
    capaUrl: viagem.capaUrl,
    criadaEm: viagem.criadaEm,
  };
}

export function paraDiaResponse(dia: Dia): DiaResponse {
  return {
    id: dia.id,
    viagemId: dia.viagemId,
    numeroDia: dia.numeroDia,
    data: dia.data,
    titulo: dia.titulo,
    destinoId: dia.destinoId,
  };
}

/** Resumo de orçamento/progresso da viagem (GET /viagens/{id}/resumo). */
export interface ResumoViagemResponse {
  readonly dias: number;
  readonly locais: number;
  readonly passagens: number;
  readonly hoteis: number;
  readonly totalItens: number;
  readonly itensOrganizados: number;
  readonly progresso: number;
  readonly orcamento: {
    readonly locais: number;
    readonly passagens: number;
    readonly hoteis: number;
    readonly total: number;
  };
}

