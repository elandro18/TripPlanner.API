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
import { DestinoNaoEncontradoError } from '../../common/errors/dominio-extras.error';
import { ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DestinosService } from './destinos.service';
import { AtualizarDestinoDto, CriarDestinoDto, ReordenarDestinosDto } from './dto/destino.dto';
import { DestinoResponse } from './dto/destino-response';

const idDeDestino = new IdParamPipe(() => new DestinoNaoEncontradoError());
const idDeViagem = new IdParamPipe(() => new ViagemNaoEncontradaError());

/** Destinos de uma viagem — todos exigem Bearer (RN-004). */
@ApiTags('destinos')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class DestinosController {
  constructor(private readonly destinos: DestinosService) {}

  @Get('viagens/:viagemId/destinos')
  listar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DestinoResponse[]> {
    return this.destinos.listar(viagemId, usuario.id);
  }

  @Post('viagens/:viagemId/destinos')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: CriarDestinoDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DestinoResponse> {
    return this.destinos.criar(viagemId, dto, usuario.id);
  }

  @Put('viagens/:viagemId/destinos/reordenar')
  reordenar(
    @Param('viagemId', idDeViagem) viagemId: number,
    @Body() dto: ReordenarDestinosDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DestinoResponse[]> {
    return this.destinos.reordenar(viagemId, dto.ids, usuario.id);
  }

  @Get('destinos/:id')
  buscar(
    @Param('id', idDeDestino) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DestinoResponse> {
    return this.destinos.buscar(id, usuario.id);
  }

  @Put('destinos/:id')
  atualizar(
    @Param('id', idDeDestino) id: number,
    @Body() dto: AtualizarDestinoDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<DestinoResponse> {
    return this.destinos.atualizar(id, dto, usuario.id);
  }

  @Delete('destinos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(
    @Param('id', idDeDestino) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<void> {
    await this.destinos.excluir(id, usuario.id);
  }
}
