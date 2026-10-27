import { ValidationError } from 'class-validator';
import { mapearErrosDeValidacao } from './validation-exception.factory';

function erroValidacao(property: string, constraints: Record<string, string>): ValidationError {
  return { property, constraints, children: [] } as unknown as ValidationError;
}

describe('mapearErrosDeValidacao (ERROR_CATALOG §1)', () => {
  it('mapeia os campos do cadastro para ERR-002/003/005 na ordem do DTO', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('senha', { isNotEmpty: 'Senha é obrigatória' }),
      erroValidacao('nome', { isNotEmpty: 'Nome é obrigatório' }),
      erroValidacao('email', { isNotEmpty: 'E-mail é obrigatório' }),
    ]);

    expect(detalhes).toEqual([
      { id: 'ERR-002', message: 'Nome é obrigatório', field: 'nome', detail: null },
      { id: 'ERR-003', message: 'E-mail é obrigatório', field: 'email', detail: null },
      { id: 'ERR-005', message: 'Senha é obrigatória', field: 'senha', detail: null },
    ]);
  });

  it('usa ERR-004 quando o e-mail falha no formato', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('email', { isEmail: 'Formato de e-mail inválido' }),
    ]);

    expect(detalhes).toEqual([
      { id: 'ERR-004', message: 'Formato de e-mail inválido', field: 'email', detail: null },
    ]);
  });

  it('define um único detalhe por campo (prioriza o campo ausente sobre o formato)', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('email', { isEmail: 'Formato de e-mail inválido', isNotEmpty: 'E-mail é obrigatório' }),
    ]);

    expect(detalhes).toHaveLength(1);
    expect(detalhes[0].id).toBe('ERR-003');
  });

  it('usa ERR-001 para campos fora do catálogo específico', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('origem', { isNotEmpty: 'Campo obrigatório: origem' }),
    ]);

    expect(detalhes).toEqual([
      { id: 'ERR-001', message: 'Campo obrigatório: origem', field: 'origem', detail: null },
    ]);
  });

  it('mapeia os campos de viagem para ERR-006/007/008', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('dataFim', { isNotEmpty: 'Data de fim é obrigatória' }),
      erroValidacao('dataInicio', { isNotEmpty: 'Data de início é obrigatória' }),
      erroValidacao('destino', { isNotEmpty: 'Destino é obrigatório' }),
    ]);

    expect(detalhes.map((item) => item.id)).toEqual(['ERR-008', 'ERR-006', 'ERR-007']);
  });

  it('mapeia tipo de passagem inválido para ERR-009', () => {
    expect(mapearErrosDeValidacao([erroValidacao('tipo', { isIn: 'Tipo de passagem inválido' })])).toEqual([
      { id: 'ERR-009', message: 'Tipo de passagem inválido', field: 'tipo', detail: null },
    ]);
  });

  it('mapeia valor negativo para ERR-011 e valor total ausente para ERR-013', () => {
    const detalhes = mapearErrosDeValidacao([
      erroValidacao('custo', { min: 'Valor não pode ser negativo' }),
      erroValidacao('valorTotal', { isNotEmpty: 'Valor total é obrigatório' }),
    ]);

    expect(detalhes.map((item) => item.id)).toEqual(['ERR-011', 'ERR-013']);
  });

  it('mapeia paginação inválida para ERR-016', () => {
    expect(mapearErrosDeValidacao([erroValidacao('page', { isInt: 'Parâmetro de paginação inválido' })])).toEqual([
      { id: 'ERR-016', message: 'Parâmetro de paginação inválido', field: 'page', detail: null },
    ]);
  });

  it('achata erros de objetos aninhados', () => {
    const aninhado = erroValidacao('endereco', {});
    aninhado.children = [erroValidacao('cidade', { isNotEmpty: 'Cidade é obrigatória' })];

    expect(mapearErrosDeValidacao([aninhado])).toEqual([
      { id: 'ERR-001', message: 'Cidade é obrigatória', field: 'endereco.cidade', detail: null },
    ]);
  });

  it('ignora erros sem constraints', () => {
    expect(mapearErrosDeValidacao([erroValidacao('nome', {})])).toEqual([]);
  });
});
