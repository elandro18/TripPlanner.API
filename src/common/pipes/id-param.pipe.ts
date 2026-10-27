import { Injectable, PipeTransform } from '@nestjs/common';
import { DominioError } from '../errors/dominio.error';

/**
 * Converte um parâmetro de rota (`:id`) em inteiro positivo.
 *
 * Um identificador não numérico é tratado como **recurso inexistente**: lança o
 * erro de "não encontrado" do recurso (`ERR-060`..`ERR-064`), evitando expor um
 * código fora do catálogo para um path inválido.
 */
@Injectable()
export class IdParamPipe implements PipeTransform<string, number> {
  constructor(private readonly erroNaoEncontrado: () => DominioError) {}

  transform(valor: string): number {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
      throw this.erroNaoEncontrado();
    }
    return id;
  }
}
