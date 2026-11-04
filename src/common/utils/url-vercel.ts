/**
 * Reconstrução da URL em ambiente serverless (Vercel).
 *
 * O `rewrite` do `vercel.json` precisa apontar para a função (`/api`), e isso
 * **mascara** o caminho original: a função recebe apenas `/`. Para não perder a
 * rota, o rewrite copia o caminho original para um parâmetro de query
 * (`caminhoOriginal`) e ele é reconstruído aqui antes de entregar a requisição
 * ao Express/Nest.
 *
 * Fora da Vercel (execução local, testes) o parâmetro não existe e a URL é
 * devolvida intacta.
 */

/** Nome do parâmetro usado pelo `vercel.json`. */
export const PARAMETRO_CAMINHO = 'caminhoOriginal';

/**
 * Devolve a URL que o Nest deve processar.
 *
 * @example
 * normalizarUrlDeFuncao('/api?caminhoOriginal=api/v1/health') // '/api/v1/health'
 * normalizarUrlDeFuncao('/api?caminhoOriginal=api/v1/viagens&page=0') // '/api/v1/viagens?page=0'
 * normalizarUrlDeFuncao('/api/v1/health') // '/api/v1/health' (sem Vercel)
 */
export function normalizarUrlDeFuncao(url: string): string {
  const indice = url.indexOf('?');
  if (indice === -1) {
    return url;
  }

  const parametros = new URLSearchParams(url.slice(indice + 1));
  const caminho = parametros.get(PARAMETRO_CAMINHO);
  if (caminho === null) {
    return url;
  }

  parametros.delete(PARAMETRO_CAMINHO);

  const alvo = `/${caminho.replace(/^\/+/, '')}`;
  const restante = parametros.toString();

  return restante.length > 0 ? `${alvo}?${restante}` : alvo;
}
