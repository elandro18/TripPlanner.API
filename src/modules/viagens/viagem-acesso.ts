import { AcessoNegadoError, DominioError, ViagemNaoEncontradaError } from '../../common/errors/dominio.error';
import { Viagem } from './viagem.model';
import { ViagensRepository } from './viagens.repository';

/**
 * Regra transversal de isolamento por dono (RN-004).
 *
 * - viagem inexistente → erro de "não encontrado" (`ERR-060` por padrão);
 * - viagem de outro usuário → `ERR-032` (403);
 * - viagem do usuário → devolve a viagem.
 *
 * Os módulos de itens passam o seu próprio erro de "não encontrado"
 * (`ERR-062`/`ERR-063`/`ERR-064`) para o caso de item órfão (viagem removida).
 */
export async function exigirViagemDoUsuario(
  viagens: ViagensRepository,
  viagemId: number,
  usuarioId: number,
  erroNaoEncontrado: () => DominioError = () => new ViagemNaoEncontradaError(),
): Promise<Viagem> {
  const viagem = await viagens.buscarPorId(viagemId);
  if (!viagem) {
    throw erroNaoEncontrado();
  }
  if (viagem.usuarioId !== usuarioId) {
    throw new AcessoNegadoError();
  }
  return viagem;
}
