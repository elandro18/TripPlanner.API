import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CardNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { DiaNaoEncontradoError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AtualizarRoteiroDto, CriarRoteiroDto, ReordenarRoteiroDto } from './dto/roteiro.dto';
import { RoteiroResponse } from './dto/roteiro-response';
import { RoteiroService } from './roteiro.service';

const idDeCard = new IdParamPipe(() => new CardNaoEncontradoError());
const idDeDia = new IdParamPipe(() => new DiaNaoEncontradoError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/** Roteiro (Kanban) — RN-019 a RN-022. */
@ApiTags('roteiro')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class RoteiroController {
  constructor(private readonly roteiro: RoteiroService) {}

  @Get('viagens/:viagemId/roteiro')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RoteiroResponse[]> {
    return this.roteiro.listarPorViagem(viagemId, usuario.id);
  }

  @Post('dias/:diaId/roteiro')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('diaId', idDeDia) diaId: number,
    @Body() dto: CriarRoteiroDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RoteiroResponse> {
    return this.roteiro.criar(diaId, dto, usuario.id);
  }

  @Put('dias/:diaId/roteiro/reordenar')
  reordenar(
    @Param('diaId', idDeDia) diaId: number,
    @Body() dto: ReordenarRoteiroDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RoteiroResponse[]> {
    return this.roteiro.reordenar(diaId, dto.ordens, usuario.id);
  }

  @Put('roteiro/:id')
  atualizar(
    @Param('id', idDeCard) id: number,
    @Body() dto: AtualizarRoteiroDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<RoteiroResponse> {
    return this.roteiro.atualizar(id, dto, usuario.id);
  }

  @Delete('roteiro/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(
    @Param('id', idDeCard) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<void> {
    await this.roteiro.excluir(id, usuario.id);
  }
}
