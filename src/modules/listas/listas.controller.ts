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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ItemListaNaoEncontradoError,
  ListaNaoEncontradaError,
} from '../../common/errors/dominio-extras.error';
import { IdParamPipe } from '../../common/pipes/id-param.pipe';
import { UsuarioDaRequisicao } from '../auth/auth.types';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AtualizarListaDto,
  AtualizarListaItemDto,
  CriarListaDto,
  CriarListaItemDto,
  ListarListasQueryDto,
  ReordenarListaItensDto,
} from './dto/lista.dto';
import { ListaItemResponse, ListaResponse } from './dto/lista-response';
import { ListasService } from './listas.service';

const idDeLista = new IdParamPipe(() => new ListaNaoEncontradaError());
const idDeItem = new IdParamPipe(() => new ItemListaNaoEncontradoError());

/** Listas/checklists do usuário — isolamento por dono (RN-004). */
@ApiTags('listas')
@ApiBearerAuth('bearer')
@Controller()
@UseGuards(JwtAuthGuard)
export class ListasController {
  constructor(private readonly listas: ListasService) {}

  @Get('listas')
  listar(
    @Query() query: ListarListasQueryDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaResponse[]> {
    return this.listas.listar(usuario.id, query.viagemId);
  }

  @Post('listas')
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Body() dto: CriarListaDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaResponse> {
    return this.listas.criar(dto, usuario.id);
  }

  @Get('listas/:id')
  buscar(
    @Param('id', idDeLista) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaResponse> {
    return this.listas.buscar(id, usuario.id);
  }

  @Put('listas/:id')
  atualizar(
    @Param('id', idDeLista) id: number,
    @Body() dto: AtualizarListaDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaResponse> {
    return this.listas.atualizar(id, dto, usuario.id);
  }

  @Delete('listas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(
    @Param('id', idDeLista) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<void> {
    await this.listas.excluir(id, usuario.id);
  }

  @Get('listas/:id/itens')
  listarItens(
    @Param('id', idDeLista) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaItemResponse[]> {
    return this.listas.listarItens(id, usuario.id);
  }

  @Post('listas/:id/itens')
  @HttpCode(HttpStatus.CREATED)
  criarItem(
    @Param('id', idDeLista) id: number,
    @Body() dto: CriarListaItemDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaItemResponse> {
    return this.listas.criarItem(id, dto, usuario.id);
  }

  @Put('listas/:id/itens/reordenar')
  reordenarItens(
    @Param('id', idDeLista) id: number,
    @Body() dto: ReordenarListaItensDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaItemResponse[]> {
    return this.listas.reordenarItens(id, dto.ordens, usuario.id);
  }

  @Put('itens/:id')
  atualizarItem(
    @Param('id', idDeItem) id: number,
    @Body() dto: AtualizarListaItemDto,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<ListaItemResponse> {
    return this.listas.atualizarItem(id, dto, usuario.id);
  }

  @Delete('itens/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluirItem(
    @Param('id', idDeItem) id: number,
    @UsuarioAtual() usuario: UsuarioDaRequisicao,
  ): Promise<void> {
    await this.listas.excluirItem(id, usuario.id);
  }
}
