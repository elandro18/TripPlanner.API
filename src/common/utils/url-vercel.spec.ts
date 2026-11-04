import { normalizarUrlDeFuncao, PARAMETRO_CAMINHO } from './url-vercel';

describe('normalizarUrlDeFuncao', () => {
  it('devolve a URL intacta quando não vem da Vercel (execução local)', () => {
    expect(normalizarUrlDeFuncao('/api/v1/health')).toBe('/api/v1/health');
    expect(normalizarUrlDeFuncao('/api/v1/viagens?page=0&size=5')).toBe(
      '/api/v1/viagens?page=0&size=5',
    );
  });

  it(`usa o parâmetro "${PARAMETRO_CAMINHO}" para restaurar o caminho mascarado`, () => {
    expect(normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=api/v1/health`)).toBe(
      '/api/v1/health',
    );
    expect(normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=api/docs`)).toBe('/api/docs');
  });

  it('preserva os demais parâmetros de query da requisição', () => {
    expect(
      normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=api/v1/viagens&page=0&size=5`),
    ).toBe('/api/v1/viagens?page=0&size=5');
  });

  it('remove o parâmetro auxiliar da URL final', () => {
    const url = normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=api/v1/listas`);

    expect(url).not.toContain(PARAMETRO_CAMINHO);
  });

  it('normaliza barras iniciais duplicadas', () => {
    expect(normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=/api/v1/health`)).toBe(
      '/api/v1/health',
    );
  });

  it('trata a raiz (caminho vazio)', () => {
    expect(normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=`)).toBe('/');
  });

  it('decodifica o caminho enviado pela Vercel', () => {
    expect(
      normalizarUrlDeFuncao(`/api?${PARAMETRO_CAMINHO}=${encodeURIComponent('api/v1/viagens')}`),
    ).toBe('/api/v1/viagens');
  });
});
