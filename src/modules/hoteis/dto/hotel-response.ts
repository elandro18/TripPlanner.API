import { Hotel } from '../hotel.model';

/** Hotel como exposto na API (`API_CONTRACTS.md` §6). */
export interface HotelResponse {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly dataHoraCheckin: string;
  readonly dataHoraCheckout: string;
  readonly valorNoite: number | null;
  readonly noites: number | null;
  readonly valorTotal: number | null;
  readonly reserva: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly geoStatus: string | null;
}

export function paraHotelResponse(hotel: Hotel): HotelResponse {
  return {
    id: hotel.id,
    viagemId: hotel.viagemId,
    nome: hotel.nome,
    endereco: hotel.endereco,
    cidade: hotel.cidade,
    dataHoraCheckin: hotel.dataHoraCheckin,
    dataHoraCheckout: hotel.dataHoraCheckout,
    valorNoite: hotel.valorNoite,
    noites: hotel.noites,
    valorTotal: hotel.valorTotal,
    reserva: hotel.reserva,
    fotoUrl: hotel.fotoUrl,
    lat: hotel.lat,
    lng: hotel.lng,
    geoStatus: hotel.geoStatus,
  };
}
