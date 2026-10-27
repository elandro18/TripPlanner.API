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
import { DiaNaoEncontradoError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiasService } from './dias.service';
import { AtualizarDiaDto, CriarDiaDto } from './dto/dia.dto';
import { DiaResponse } from './dto/viagem-response';

const idDeDia = new IdParamPipe(() => new DiaNaoEncontradoError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/**
 * Dias da viagem — colunas do Kanban (RN-008, RN-009).
 *
 * `GET /viagens/{viagemId}/dias` lista as colunas; `POST` cria um dia manual e
 * `PUT`/`DELETE /dias/{id}` editam/removem a coluna.
 */
@ApiTags('viagens')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class DiasController {
  constructor(private readonly dias: DiasService) {}

  @Get('viagens/:viagemId/dias')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DiaResponse[]> {
    return this.dias.listarPorViagem(viagemId, usuario.id);
  }

  @Post('viagens/:viagemId/dias')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: CriarDiaDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DiaResponse> {
    return this.dias.criar(viagemId, dto, usuario.id);
  }

  @Get('dias/:id')
  buscar(
    @Param('id', idDeDia) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DiaResponse> {
    return this.dias.buscar(id, usuario.id);
  }

  @Put('dias/:id')
  atualizar(
    @Param('id', idDeDia) id: number,
    @Body() dto: AtualizarDiaDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DiaResponse> {
    return this.dias.atualizar(id, dto, usuario.id);
  }

  @Delete('dias/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(
    @Param('id', idDeDia) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<void> {
    await this.dias.excluir(id, usuario.id);
  }
}
