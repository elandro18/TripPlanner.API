import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { RespostaPaginada } from '../../common/dto/resposta-paginada';
import { PassagemNaoEncontradaError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarPassagemDto, CriarPassagemDto } from './dto/passagem.dto';
import { PassagemResponse } from './dto/passagem-response';
import { PassagensService } from './passagens.service';

const idDePassagem = new IdParamPipe(() => new PassagemNaoEncontradaError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/** Passagens (`specs/API_CONTRACTS.md` §5) — todos exigem Bearer (RN-004). */
@ApiTags('passagens')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class PassagensController {
  constructor(private readonly passagens: PassagensService) {}

  /** §5.1 — `GET /api/v1/viagens/{viagemId}/passagens` (paginação offset). */
  @Get('viagens/:viagemId/passagens')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Query() paginacao: PaginacaoQueryDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RespostaPaginada<PassagemResponse>> {
    return this.passagens.listarPorViagem(viagemId, usuario.id, paginacao);
  }

  /** §5.2 — `POST /api/v1/viagens/{viagemId}/passagens` → 201. */
  @Post('viagens/:viagemId/passagens')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: CriarPassagemDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<PassagemResponse> {
    return this.passagens.criar(viagemId, dto, usuario.id);
  }

  /** §5.3 — `GET /api/v1/passagens/{id}`. */
  @Get('passagens/:id')
  buscar(@Param('id', idDePassagem) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<PassagemResponse> {
    return this.passagens.buscar(id, usuario.id);
  }

  /** §5.4 — `PUT /api/v1/passagens/{id}`. */
  @Put('passagens/:id')
  atualizar(
    @Param('id', idDePassagem) id: number,
    @Body() dto: AtualizarPassagemDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<PassagemResponse> {
    return this.passagens.atualizar(id, dto, usuario.id);
  }

  /** §5.5 — `DELETE /api/v1/passagens/{id}` → 204. */
  @Delete('passagens/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id', idDePassagem) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<void> {
    await this.passagens.excluir(id, usuario.id);
  }
}
