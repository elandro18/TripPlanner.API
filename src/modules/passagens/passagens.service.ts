import { Inject, Injectable } from '@nestjs/common';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { paginar, RespostaPaginada } from '../../common/dto/resposta-paginada';
import { ChegadaAnteriorPartidaError, PassagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { instanteDe } from '../../common/utils/datas';
import { opcional } from '../../common/utils/texto';
import { VINCULOS_ROTEIRO_REPOSITORY, VinculosRoteiroRepository } from '../roteiro/vinculos-roteiro.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { CriarPassagemDto } from './dto/passagem.dto';
import { paraPassagemResponse, PassagemResponse } from './dto/passagem-response';
import { DadosPassagem, Passagem, TipoPassagem } from './passagem.model';
import { PASSAGEM_REPOSITORY, PassagensRepository } from './passagens.repository';

/** CRUD de passagens (RN-013, RN-014, RN-015) com isolamento por dono (RN-004). */
@Injectable()
export class PassagensService {
  constructor(
    @Inject(PASSAGEM_REPOSITORY) private readonly passagens: PassagensRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(VINCULOS_ROTEIRO_REPOSITORY) private readonly vinculos: VinculosRoteiroRepository,
  ) {}

  async listarPorViagem(
    viagemId: number,
    usuarioId: number,
    paginacao: PaginacaoQueryDto,
  ): Promise<RespostaPaginada<PassagemResponse>> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const passagens = await this.passagens.listarPorViagem(viagem.id);
    return paginar(passagens.map(paraPassagemResponse), paginacao.page, paginacao.size);
  }

  async buscar(id: number, usuarioId: number): Promise<PassagemResponse> {
    const passagem = await this.passagemDoUsuario(id, usuarioId);
    return paraPassagemResponse(passagem);
  }

  /** RN-013 — registra tipo, origem, destino, partida/chegada, companhia, localizador e valor. */
  async criar(viagemId: number, dto: CriarPassagemDto, usuarioId: number): Promise<PassagemResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const passagem = await this.passagens.criar(this.montar(viagem.id, dto));
    return paraPassagemResponse(passagem);
  }

  /** RN-015 — editar. */
  async atualizar(id: number, dto: CriarPassagemDto, usuarioId: number): Promise<PassagemResponse> {
    const passagem = await this.passagemDoUsuario(id, usuarioId);
    const atualizada = await this.passagens.atualizar(passagem.id, this.montar(passagem.viagemId, dto));
    return paraPassagemResponse(atualizada);
  }

  /** RN-015 — excluir a passagem e os cards vinculados a ela. */
  async excluir(id: number, usuarioId: number): Promise<void> {
    const passagem = await this.passagemDoUsuario(id, usuarioId);
    await this.vinculos.excluirPorItem('PASSAGEM', passagem.id);
    await this.passagens.excluir(passagem.id);
  }

  private montar(viagemId: number, dto: CriarPassagemDto): DadosPassagem {
    const dataHoraChegada = opcional(dto.dataHoraChegada);
    this.validarHorarios(dto.dataHoraPartida, dataHoraChegada);

    return {
      viagemId,
      tipo: dto.tipo as TipoPassagem,
      origem: dto.origem.trim(),
      destino: dto.destino.trim(),
      dataHoraPartida: dto.dataHoraPartida,
      dataHoraChegada,
      companhia: opcional(dto.companhia),
      localizador: opcional(dto.localizador),
      numeroBilhete: opcional(dto.numeroBilhete),
      passageiro: opcional(dto.passageiro),
      classe: opcional(dto.classe),
      terminal: opcional(dto.terminal),
      assento: opcional(dto.assento),
      moeda: opcional(dto.moeda),
      valor: dto.valor ?? null,
      documentoHash: opcional(dto.documentoHash),
      importadoDe: dto.importadoDe ?? null,
    };
  }

  /** RN-013 — a chegada, quando informada, deve ser >= à partida (ERR-010). */
  private validarHorarios(partida: string, chegada: string | null): void {
    if (!chegada) {
      return;
    }
    const inicio = instanteDe(partida);
    const fim = instanteDe(chegada);
    if (inicio === null || fim === null || fim < inicio) {
      throw new ChegadaAnteriorPartidaError();
    }
  }

  /** Carrega a passagem e valida que a viagem dela pertence ao usuário (RN-004). */
  private async passagemDoUsuario(id: number, usuarioId: number): Promise<Passagem> {
    const passagem = await this.passagens.buscarPorId(id);
    if (!passagem) {
      throw new PassagemNaoEncontradaError();
    }
    await exigirViagemDoUsuario(this.viagens, passagem.viagemId, usuarioId, () => new PassagemNaoEncontradaError());
    return passagem;
  }
}
