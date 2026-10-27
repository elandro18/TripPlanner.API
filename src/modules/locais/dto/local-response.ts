import { Local } from '../local.model';

/** Local como exposto na API (`API_CONTRACTS.md` §4). */
export interface LocalResponse {
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
  readonly duracaoEstimada: number | null;
  readonly custo: number | null;
  readonly observacoes: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly geoStatus: string | null;
}

export function paraLocalResponse(local: Local): LocalResponse {
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
    duracaoEstimada: local.duracaoEstimada,
    custo: local.custo,
    observacoes: local.observacoes,
    fotoUrl: local.fotoUrl,
    lat: local.lat,
    lng: local.lng,
    geoStatus: local.geoStatus,
  };
}
