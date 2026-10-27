import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { RespostaPaginada } from '../../common/dto/resposta-paginada';
import { LocalNaoEncontradoError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarLocalDto, CriarLocalDto } from './dto/local.dto';
import { LocalResponse } from './dto/local-response';
import { LocaisService } from './locais.service';

const idDeLocal = new IdParamPipe(() => new LocalNaoEncontradoError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/** Locais (`specs/API_CONTRACTS.md` §4) — todos exigem Bearer (RN-004). */
@ApiTags('locais')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class LocaisController {
  constructor(private readonly locais: LocaisService) {}

  /** §4.1 — `GET /api/v1/viagens/{viagemId}/locais` (paginação offset). */
  @Get('viagens/:viagemId/locais')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Query() paginacao: PaginacaoQueryDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RespostaPaginada<LocalResponse>> {
    return this.locais.listarPorViagem(viagemId, usuario.id, paginacao);
  }

  /** §4.2 — `POST /api/v1/viagens/{viagemId}/locais` → 201. */
  @Post('viagens/:viagemId/locais')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: CriarLocalDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<LocalResponse> {
    return this.locais.criar(viagemId, dto, usuario.id);
  }

  /** §4.3 — `GET /api/v1/locais/{id}`. */
  @Get('locais/:id')
  buscar(@Param('id', idDeLocal) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<LocalResponse> {
    return this.locais.buscar(id, usuario.id);
  }

  /** §4.4 — `PUT /api/v1/locais/{id}`. */
  @Put('locais/:id')
  atualizar(
    @Param('id', idDeLocal) id: number,
    @Body() dto: AtualizarLocalDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<LocalResponse> {
    return this.locais.atualizar(id, dto, usuario.id);
  }

  /** §4.5 — `DELETE /api/v1/locais/{id}` → 204. */
  @Delete('locais/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id', idDeLocal) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<void> {
    await this.locais.excluir(id, usuario.id);
  }
}
