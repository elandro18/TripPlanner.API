import { Injectable } from '@nestjs/common';
import { HotelNaoEncontradoError } from '../../common/errors/dominio.error';
import { deCentavos, paraCentavos } from '../../common/utils/dinheiro';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosHotel, Hotel } from './hotel.model';
import { HoteisRepository } from './hoteis.repository';

interface LinhaHotel {
  readonly id: number;
  readonly viagemId: number;
  readonly nome: string;
  readonly endereco: string | null;
  readonly cidade: string | null;
  readonly checkin: string;
  readonly checkout: string;
  readonly valorNoiteCentavos: number | null;
  readonly noites: number | null;
  readonly valorTotalCentavos: number | null;
  readonly codigoReserva: string | null;
  readonly fotoUrl: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly geoStatus: string | null;
}

/** Adaptador Prisma do repositório de hotéis (RN-016, RN-017, RN-018). */
@Injectable()
export class PrismaHoteisRepository implements HoteisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Hotel[]> {
    const hoteis = await this.prisma.hotel.findMany({
      where: { viagemId },
      orderBy: { id: 'asc' },
    });
    return hoteis.map((hotel) => this.paraModelo(hotel));
  }

  async buscarPorId(id: number): Promise<Hotel | null> {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    return hotel ? this.paraModelo(hotel) : null;
  }

  async criar(dados: DadosHotel): Promise<Hotel> {
    const hotel = await this.prisma.hotel.create({ data: this.paraDados(dados) });
    return this.paraModelo(hotel);
  }

  async atualizar(id: number, dados: DadosHotel): Promise<Hotel> {
    try {
      const hotel = await this.prisma.hotel.update({
        where: { id },
        data: this.paraDados(dados),
      });
      return this.paraModelo(hotel);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new HotelNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.hotel.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new HotelNaoEncontradoError();
      }
      throw erro;
    }
  }

  async excluirPorViagem(viagemId: number): Promise<number> {
    const resultado = await this.prisma.hotel.deleteMany({ where: { viagemId } });
    return resultado.count;
  }

  private paraDados(dados: DadosHotel) {
    return {
      viagemId: dados.viagemId,
      nome: dados.nome,
      endereco: dados.endereco ?? null,
      cidade: dados.cidade ?? null,
      checkin: dados.dataHoraCheckin,
      checkout: dados.dataHoraCheckout,
      valorNoiteCentavos: paraCentavos(dados.valorNoite),
      noites: dados.noites ?? null,
      valorTotalCentavos: paraCentavos(dados.valorTotal),
      codigoReserva: dados.reserva ?? null,
      fotoUrl: dados.fotoUrl ?? null,
      lat: dados.lat ?? null,
      lng: dados.lng ?? null,
      geoStatus: dados.geoStatus ?? null,
    };
  }

  private paraModelo(hotel: LinhaHotel): Hotel {
    return {
      id: hotel.id,
      viagemId: hotel.viagemId,
      nome: hotel.nome,
      endereco: hotel.endereco,
      cidade: hotel.cidade,
      dataHoraCheckin: hotel.checkin,
      dataHoraCheckout: hotel.checkout,
      valorNoite: deCentavos(hotel.valorNoiteCentavos),
      noites: hotel.noites,
      valorTotal: deCentavos(hotel.valorTotalCentavos),
      reserva: hotel.codigoReserva,
      fotoUrl: hotel.fotoUrl,
      lat: hotel.lat,
      lng: hotel.lng,
      geoStatus: hotel.geoStatus,
    };
  }
}
