import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { RespostaPaginada } from '../../common/dto/resposta-paginada';
import { ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarViagemDto, CriarViagemDto } from './dto/viagem.dto';
import { ResumoViagemResponse, ViagemResponse } from './dto/viagem-response';
import { ViagensService } from './viagens.service';

const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/**
 * Viagens (`specs/API_CONTRACTS.md` §2). Todos os endpoints exigem Bearer e
 * operam apenas sobre as viagens do próprio usuário (RN-004).
 */
@ApiTags('viagens')
@ApiBearerAuth('bearer')
@Controller('viagens')
@UseGuards(JwtAuthGuard)
export class ViagensController {
  constructor(private readonly viagens: ViagensService) {}

  /** §2.1 — `GET /api/v1/viagens` (paginação offset). */
  @Get()
  listar(
    @Query() paginacao: PaginacaoQueryDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RespostaPaginada<ViagemResponse>> {
    return this.viagens.listar(usuario.id, paginacao);
  }

  /** §2.2 — `POST /api/v1/viagens` → 201 (dias gerados — RN-034). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dto: CriarViagemDto, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<ViagemResponse> {
    return this.viagens.criar(dto, usuario.id);
  }

  /** Resumo de orçamento/progresso — `GET /viagens/{id}/resumo`. */
  @Get(':id/resumo')
  resumo(
    @Param('id', idDeViagem) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ResumoViagemResponse> {
    return this.viagens.resumo(id, usuario.id);
  }

  /** §2.3 — `GET /api/v1/viagens/{id}`. */
  @Get(':id')
  buscar(@Param('id', idDeViagem) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<ViagemResponse> {
    return this.viagens.buscar(id, usuario.id);
  }

  /** §2.4 — `PUT /api/v1/viagens/{id}` (altera o período → regenera os dias). */
  @Put(':id')
  atualizar(
    @Param('id', idDeViagem) id: number,
    @Body() dto: AtualizarViagemDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ViagemResponse> {
    return this.viagens.atualizar(id, dto, usuario.id);
  }

  /** Troca a viagem ativa do usuário (RN-006) — `PUT /viagens/{id}/ativa`. */
  @Put(':id/ativa')
  ativar(
    @Param('id', idDeViagem) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ViagemResponse> {
    return this.viagens.ativar(id, usuario.id);
  }

  /** §2.5 — `DELETE /api/v1/viagens/{id}` → 204. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@Param('id', idDeViagem) id: number, @UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<void> {
    await this.viagens.excluir(id, usuario.id);
  }
}
