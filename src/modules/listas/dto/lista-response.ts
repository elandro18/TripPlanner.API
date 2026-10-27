import { Lista, ListaItem } from '../lista.model';

export interface ListaResponse {
  readonly id: number;
  readonly usuarioId: number;
  readonly viagemId: number | null;
  readonly nome: string;
  readonly categoria: string;
  readonly criadaEm: string;
}

export interface ListaItemResponse {
  readonly id: number;
  readonly listaId: number;
  readonly nome: string;
  readonly tipo: string | null;
  readonly valor: number | null;
  readonly valorPrevisto: number | null;
  readonly valorPago: number | null;
  readonly pagoEm: string | null;
  readonly concluido: boolean;
  readonly concluidoEm: string | null;
  readonly ordem: number;
  readonly criadaEm: string;
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

export function paraListaResponse(lista: Lista): ListaResponse {
  return {
    id: lista.id,
    usuarioId: lista.usuarioId,
    viagemId: lista.viagemId,
    nome: lista.nome,
    categoria: lista.categoria,
    criadaEm: lista.criadaEm,
  };
}

export function paraListaItemResponse(item: ListaItem): ListaItemResponse {
  return {
    id: item.id,
    listaId: item.listaId,
    nome: item.nome,
    tipo: item.tipo,
    valor: item.valor,
    valorPrevisto: item.valorPrevisto,
    valorPago: item.valorPago,
    pagoEm: item.pagoEm,
    concluido: item.concluido,
    concluidoEm: item.concluidoEm,
    ordem: item.ordem,
    criadaEm: item.criadaEm,
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
