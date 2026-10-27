import { paginar } from './resposta-paginada';

describe('paginar (envelope offset — API_CONTRACTS)', () => {
  const itens = [1, 2, 3, 4, 5];

  it('devolve a primeira página com os totais', () => {
    expect(paginar(itens, 0, 2)).toEqual({
      content: [1, 2],
      page: 0,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    });
  });

  it('devolve a última página parcial', () => {
    expect(paginar(itens, 2, 2)).toEqual({
      content: [5],
      page: 2,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    });
  });

  it('devolve lista vazia quando a página excede o total', () => {
    expect(paginar(itens, 10, 2)).toMatchObject({ content: [], totalElements: 5, totalPages: 3 });
  });

  it('devolve zeros em coleção vazia', () => {
    expect(paginar([], 0, 20)).toEqual({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });
});
