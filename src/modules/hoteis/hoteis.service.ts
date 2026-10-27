import { Inject, Injectable } from '@nestjs/common';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { paginar, RespostaPaginada } from '../../common/dto/resposta-paginada';
import { CheckoutAnteriorCheckinError, HotelNaoEncontradoError } from '../../common/errors/dominio.error';
import { opcional } from '../../common/utils/texto';
import { instanteDe } from '../../common/utils/datas';
import { VINCULOS_ROTEIRO_REPOSITORY, VinculosRoteiroRepository } from '../roteiro/vinculos-roteiro.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { CriarHotelDto } from './dto/hotel.dto';
import { HotelResponse, paraHotelResponse } from './dto/hotel-response';
import { calcularValorTotal, DadosHotel, Hotel } from './hotel.model';
import { HOTEL_REPOSITORY, HoteisRepository } from './hoteis.repository';

/** CRUD de hotéis (RN-016, RN-017, RN-018) com isolamento por dono (RN-004). */
@Injectable()
export class HoteisService {
  constructor(
    @Inject(HOTEL_REPOSITORY) private readonly hoteis: HoteisRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(VINCULOS_ROTEIRO_REPOSITORY) private readonly vinculos: VinculosRoteiroRepository,
  ) {}

  async listarPorViagem(
    viagemId: number,
    usuarioId: number,
    paginacao: PaginacaoQueryDto,
  ): Promise<RespostaPaginada<HotelResponse>> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const hoteis = await this.hoteis.listarPorViagem(viagem.id);
    return paginar(hoteis.map(paraHotelResponse), paginacao.page, paginacao.size);
  }

  async buscar(id: number, usuarioId: number): Promise<HotelResponse> {
    const hotel = await this.hotelDoUsuario(id, usuarioId);
    return paraHotelResponse(hotel);
  }

  /** RN-016 — registra nome, endereço, cidade, check-in/out, valores e reserva. */
  async criar(viagemId: number, dto: CriarHotelDto, usuarioId: number): Promise<HotelResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const hotel = await this.hoteis.criar(this.montar(viagem.id, dto));
    return paraHotelResponse(hotel);
  }

  /** RN-018 — editar. */
  async atualizar(id: number, dto: CriarHotelDto, usuarioId: number): Promise<HotelResponse> {
    const hotel = await this.hotelDoUsuario(id, usuarioId);
    const atualizado = await this.hoteis.atualizar(hotel.id, this.montar(hotel.viagemId, dto));
    return paraHotelResponse(atualizado);
  }

  /** RN-018 — excluir o hotel e os cards vinculados a ele. */
  async excluir(id: number, usuarioId: number): Promise<void> {
    const hotel = await this.hotelDoUsuario(id, usuarioId);
    await this.vinculos.excluirPorItem('HOTEL', hotel.id);
    await this.hoteis.excluir(hotel.id);
  }

  private montar(viagemId: number, dto: CriarHotelDto): DadosHotel {
    this.validarPeriodo(dto.dataHoraCheckin, dto.dataHoraCheckout);

    const valorNoite = dto.valorNoite ?? null;
    const noites = dto.noites ?? null;
    // RN-017: valor total informado tem precedência (ajuste manual); senão é
    // calculado como valorNoite × noites. Sem valores, fica nulo.
    const valorTotal = dto.valorTotal ?? calcularValorTotal(valorNoite, noites);

    return {
      viagemId,
      nome: dto.nome.trim(),
      endereco: opcional(dto.endereco),
      cidade: opcional(dto.cidade),
      dataHoraCheckin: dto.dataHoraCheckin,
      dataHoraCheckout: dto.dataHoraCheckout,
      valorNoite,
      noites,
      valorTotal,
      reserva: opcional(dto.reserva),
      fotoUrl: opcional(dto.fotoUrl),
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      geoStatus: opcional(dto.geoStatus),
    };
  }

  /** RN-016 — check-out deve ser >= ao check-in (ERR-012). */
  private validarPeriodo(checkin: string, checkout: string): void {
    const inicio = instanteDe(checkin);
    const fim = instanteDe(checkout);
    if (inicio === null || fim === null || fim < inicio) {
      throw new CheckoutAnteriorCheckinError();
    }
  }

  /** Carrega o hotel e valida que a viagem dele pertence ao usuário (RN-004). */
  private async hotelDoUsuario(id: number, usuarioId: number): Promise<Hotel> {
    const hotel = await this.hoteis.buscarPorId(id);
    if (!hotel) {
      throw new HotelNaoEncontradoError();
    }
    await exigirViagemDoUsuario(this.viagens, hotel.viagemId, usuarioId, () => new HotelNaoEncontradoError());
    return hotel;
  }
}
