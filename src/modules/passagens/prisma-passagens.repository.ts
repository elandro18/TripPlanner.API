import { Injectable } from '@nestjs/common';
import { PassagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { deCentavos, paraCentavos } from '../../common/utils/dinheiro';
import { ehRegistroNaoEncontrado } from '../../common/utils/prisma-erros';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { DadosPassagem, ImportadoDe, Passagem, TipoPassagem } from './passagem.model';
import { PassagensRepository } from './passagens.repository';

interface LinhaPassagem {
  readonly id: number;
  readonly viagemId: number;
  readonly tipo: string;
  readonly origem: string;
  readonly destino: string;
  readonly partida: string;
  readonly chegada: string | null;
  readonly companhia: string | null;
  readonly localizador: string | null;
  readonly numeroBilhete: string | null;
  readonly passageiro: string | null;
  readonly classe: string | null;
  readonly terminal: string | null;
  readonly assento: string | null;
  readonly moeda: string | null;
  readonly valorCentavos: number | null;
  readonly documentoHash: string | null;
  readonly importadoDe: string | null;
}

/** Adaptador Prisma do repositório de passagens (RN-013, RN-014, RN-015). */
@Injectable()
export class PrismaPassagensRepository implements PassagensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorViagem(viagemId: number): Promise<Passagem[]> {
    const passagens = await this.prisma.passagem.findMany({
      where: { viagemId },
      orderBy: { id: 'asc' },
    });
    return passagens.map((passagem) => this.paraModelo(passagem));
  }

  async buscarPorId(id: number): Promise<Passagem | null> {
    const passagem = await this.prisma.passagem.findUnique({ where: { id } });
    return passagem ? this.paraModelo(passagem) : null;
  }

  async criar(dados: DadosPassagem): Promise<Passagem> {
    const passagem = await this.prisma.passagem.create({ data: this.paraDados(dados) });
    return this.paraModelo(passagem);
  }

  async atualizar(id: number, dados: DadosPassagem): Promise<Passagem> {
    try {
      const passagem = await this.prisma.passagem.update({
        where: { id },
        data: this.paraDados(dados),
      });
      return this.paraModelo(passagem);
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new PassagemNaoEncontradaError();
      }
      throw erro;
    }
  }

  async excluir(id: number): Promise<void> {
    try {
      await this.prisma.passagem.delete({ where: { id } });
    } catch (erro) {
      if (ehRegistroNaoEncontrado(erro)) {
        throw new PassagemNaoEncontradaError();
      }
      throw erro;
    }
  }

  async excluirPorViagem(viagemId: number): Promise<number> {
    const resultado = await this.prisma.passagem.deleteMany({ where: { viagemId } });
    return resultado.count;
  }

  private paraDados(dados: DadosPassagem) {
    return {
      viagemId: dados.viagemId,
      tipo: dados.tipo,
      origem: dados.origem,
      destino: dados.destino,
      partida: dados.dataHoraPartida,
      chegada: dados.dataHoraChegada ?? null,
      companhia: dados.companhia ?? null,
      localizador: dados.localizador ?? null,
      numeroBilhete: dados.numeroBilhete ?? null,
      passageiro: dados.passageiro ?? null,
      classe: dados.classe ?? null,
      terminal: dados.terminal ?? null,
      assento: dados.assento ?? null,
      moeda: dados.moeda ?? null,
      valorCentavos: paraCentavos(dados.valor),
      documentoHash: dados.documentoHash ?? null,
      importadoDe: dados.importadoDe ?? null,
    };
  }

  private paraModelo(passagem: LinhaPassagem): Passagem {
    return {
      id: passagem.id,
      viagemId: passagem.viagemId,
      tipo: passagem.tipo as TipoPassagem,
      origem: passagem.origem,
      destino: passagem.destino,
      dataHoraPartida: passagem.partida,
      dataHoraChegada: passagem.chegada,
      companhia: passagem.companhia,
      localizador: passagem.localizador,
      numeroBilhete: passagem.numeroBilhete,
      passageiro: passagem.passageiro,
      classe: passagem.classe,
      terminal: passagem.terminal,
      assento: passagem.assento,
      moeda: passagem.moeda,
      valor: deCentavos(passagem.valorCentavos),
      documentoHash: passagem.documentoHash,
      importadoDe: passagem.importadoDe as ImportadoDe | null,
    };
  }
}
