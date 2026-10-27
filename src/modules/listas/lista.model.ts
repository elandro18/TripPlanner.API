/** Lista personalizada (checklist) do usuário. */
export interface Lista {
  readonly id: number;
  readonly usuarioId: number;
  /** Viagem vinculada; `null` quando a lista não está vinculada. */
  readonly viagemId: number | null;
  readonly nome: string;
  readonly categoria: string;
  readonly criadaEm: string;
}

/** Item de uma lista. */
export interface ListaItem {
  readonly id: number;
  readonly listaId: number;
  readonly nome: string;
  readonly tipo: string | null;
  /** Valores em reais (convertidos de centavos no adapter). */
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

export interface DadosLista {
  readonly usuarioId: number;
  readonly viagemId?: number | null;
  readonly nome: string;
  readonly categoria?: string;
}

export interface DadosListaItem {
  listaId: number;
  nome: string;
  tipo?: string | null;
  valor?: number | null;
  valorPrevisto?: number | null;
  valorPago?: number | null;
  pagoEm?: string | null;
  concluido?: boolean;
  concluidoEm?: string | null;
  ordem?: number;
  fotoUrl?: string | null;
  refeicao?: boolean;
  endereco?: string | null;
  cidade?: string | null;
  lat?: number | null;
  lng?: number | null;
  fotoPratoUrl?: string | null;
  fotoLocalUrl?: string | null;
  observacoes?: string | null;
}
