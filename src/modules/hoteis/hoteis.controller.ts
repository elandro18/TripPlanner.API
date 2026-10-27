import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { RespostaPaginada } from '../../common/dto/resposta-paginada';
import { HotelNaoEncontradoError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarHotelDto, CriarHotelDto } from './dto/hotel.dto';
import { HotelResponse } from './dto/hotel-response';
import { HoteisService } from './hoteis.service';

const idDeHotel = new IdParamPipe(() => new HotelNaoEncontradoError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/** Hotéis (`specs/API_CONTRACTS.md` §6) — todos exigem Bearer (RN-004). */
@ApiTags('hoteis')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class HoteisController {
  constructor(private readonly hoteis: HoteisService) {}

  /** §6.1 — `GET /api/v1/viagens/{viagemId}/hoteis` (paginação offset). */
  @Get('viagens/:viagemId/hoteis')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Query() paginacao: PaginacaoQueryDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RespostaPaginada<HotelResponse>> {
    return this.hoteis.listarPorViagem(viagemId, usuario.id, paginacao);
  }

  /** §6.2 — `POST /api/v1/viagens/{viagemId}/hoteis` → 201. */
  @Post('viagens/:viagemId/hoteis')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: CriarHotelDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<HotelResponse> {
    return this.hoteis.criar(viagemId, dto, usuario.id);
  }

  /** §6.3 — `GET /api/v1/hoteis/{id}`. */
  @Get('hoteis/:id')
  buscar(@Param('id', idDeHotel) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<HotelResponse> {
    return this.hoteis.buscar(id, usuario.id);
  }

  /** §6.4 — `PUT /api/v1/hoteis/{id}`. */
  @Put('hoteis/:id')
  atualizar(
    @Param('id', idDeHotel) id: number,
    @Body() dto: AtualizarHotelDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<HotelResponse> {
    return this.hoteis.atualizar(id, dto, usuario.id);
  }

  /** §6.5 — `DELETE /api/v1/hoteis/{id}` → 204. */
  @Delete('hoteis/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id', idDeHotel) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<void> {
    await this.hoteis.excluir(id, usuario.id);
  }
}
