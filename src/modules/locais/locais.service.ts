import { Inject, Injectable } from '@nestjs/common';
import { PaginacaoQueryDto } from '../../common/dto/paginacao.dto';
import { paginar, RespostaPaginada } from '../../common/dto/resposta-paginada';
import { LocalNaoEncontradoError } from '../../common/errors/dominio.error';
import { opcional } from '../../common/utils/texto';
import { VINCULOS_ROTEIRO_REPOSITORY, VinculosRoteiroRepository } from '../roteiro/vinculos-roteiro.repository';
import { exigirViagemDoUsuario } from '../viagens/viagem-acesso';
import { VIAGENS_REPOSITORY, ViagensRepository } from '../viagens/viagens.repository';
import { CriarLocalDto } from './dto/local.dto';
import { LocalResponse, paraLocalResponse } from './dto/local-response';
import { Local, DadosLocal } from './local.model';
import { LOCAIS_REPOSITORY, LocaisRepository } from './locais.repository';

/** CRUD de locais (RN-010, RN-011, RN-012) com isolamento por dono (RN-004). */
@Injectable()
export class LocaisService {
  constructor(
    @Inject(LOCAIS_REPOSITORY) private readonly locais: LocaisRepository,
    @Inject(VIAGENS_REPOSITORY) private readonly viagens: ViagensRepository,
    @Inject(VINCULOS_ROTEIRO_REPOSITORY) private readonly vinculos: VinculosRoteiroRepository,
  ) {}

  async listarPorViagem(
    viagemId: number,
    usuarioId: number,
    paginacao: PaginacaoQueryDto,
  ): Promise<RespostaPaginada<LocalResponse>> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const locais = await this.locais.listarPorViagem(viagem.id);
    return paginar(locais.map(paraLocalResponse), paginacao.page, paginacao.size);
  }

  async buscar(id: number, usuarioId: number): Promise<LocalResponse> {
    const local = await this.localDoUsuario(id, usuarioId);
    return paraLocalResponse(local);
  }

  /** RN-010 — registra o local (custo opcional: zero = gratuito, RN-012). */
  async criar(viagemId: number, dto: CriarLocalDto, usuarioId: number): Promise<LocalResponse> {
    const viagem = await exigirViagemDoUsuario(this.viagens, viagemId, usuarioId);
    const local = await this.locais.criar(this.montar(viagem.id, dto));
    return paraLocalResponse(local);
  }

  /** RN-011 — editar. */
  async atualizar(id: number, dto: CriarLocalDto, usuarioId: number): Promise<LocalResponse> {
    const local = await this.localDoUsuario(id, usuarioId);
    const atualizado = await this.locais.atualizar(local.id, this.montar(local.viagemId, dto));
    return paraLocalResponse(atualizado);
  }

  /** RN-011 — excluir o local e os cards vinculados a ele. */
  async excluir(id: number, usuarioId: number): Promise<void> {
    const local = await this.localDoUsuario(id, usuarioId);
    await this.vinculos.excluirPorItem('LOCAL', local.id);
    await this.locais.excluir(local.id);
  }

  private montar(viagemId: number, dto: CriarLocalDto): DadosLocal {
    return {
      viagemId,
      nome: dto.nome.trim(),
      endereco: opcional(dto.endereco),
      cidade: opcional(dto.cidade),
      categoria: opcional(dto.categoria),
      horarioPrevisto: opcional(dto.horarioPrevisto),
      horarioFim: opcional(dto.horarioFim),
      horarioAbertura: opcional(dto.horarioAbertura),
      horarioFechamento: opcional(dto.horarioFechamento),
      duracaoEstimada: dto.duracaoEstimada ?? null,
      custo: dto.custo ?? null,
      observacoes: opcional(dto.observacoes),
      fotoUrl: opcional(dto.fotoUrl),
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      geoStatus: opcional(dto.geoStatus),
    };
  }

  /** Carrega o local e valida que a viagem dele pertence ao usuário (RN-004). */
  private async localDoUsuario(id: number, usuarioId: number): Promise<Local> {
    const local = await this.locais.buscarPorId(id);
    if (!local) {
      throw new LocalNaoEncontradoError();
    }
    await exigirViagemDoUsuario(this.viagens, local.viagemId, usuarioId, () => new LocalNaoEncontradoError());
    return local;
  }
}
