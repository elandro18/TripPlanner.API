import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ApiErrorDetail } from '../errors/api-error';
import { ApiException } from '../errors/api.exception';
import { CODIGOS_ERRO } from '../errors/error-codes';

/**
 * Ordem de prioridade das constraints por campo: define **um** detalhe por
 * campo do payload (o contrato descreve erro por campo) e torna o resultado
 * determinístico independentemente da ordem de execução do class-validator.
 */
const PRIORIDADE_CONSTRAINTS = [
  'isNotEmpty',
  'isString',
  'isEmail',
  'isNumber',
  'isInt',
  'isBoolean',
  'isEnum',
  'isIn',
  'minLength',
  'maxLength',
  'min',
  'max',
  'isDateString',
  'matches',
] as const;

/**
 * Código do catálogo por campo e constraint (ERROR_CATALOG.md §1).
 *
 * O que não estiver mapeado cai em `ERR-001` (campo obrigatório genérico) —
 * o mesmo critério do catálogo, que só nomeia os campos com código próprio.
 */
const CODIGO_POR_CAMPO: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  nome: {
    isNotEmpty: CODIGOS_ERRO.NOME_OBRIGATORIO,
    isString: CODIGOS_ERRO.NOME_OBRIGATORIO,
    maxLength: CODIGOS_ERRO.NOME_OBRIGATORIO,
  },
  email: {
    isNotEmpty: CODIGOS_ERRO.EMAIL_OBRIGATORIO,
    isEmail: CODIGOS_ERRO.EMAIL_INVALIDO,
    maxLength: CODIGOS_ERRO.EMAIL_INVALIDO,
  },
  senha: {
    isNotEmpty: CODIGOS_ERRO.SENHA_OBRIGATORIA,
    isString: CODIGOS_ERRO.SENHA_OBRIGATORIA,
    minLength: CODIGOS_ERRO.SENHA_OBRIGATORIA,
    maxLength: CODIGOS_ERRO.SENHA_OBRIGATORIA,
  },
  destino: {
    isNotEmpty: CODIGOS_ERRO.DESTINO_OBRIGATORIO,
    isString: CODIGOS_ERRO.DESTINO_OBRIGATORIO,
    maxLength: CODIGOS_ERRO.DESTINO_OBRIGATORIO,
  },
  dataInicio: {
    isNotEmpty: CODIGOS_ERRO.DATA_INICIO_OBRIGATORIA,
    isDateString: CODIGOS_ERRO.DATA_INICIO_OBRIGATORIA,
    matches: CODIGOS_ERRO.DATA_INICIO_OBRIGATORIA,
  },
  dataFim: {
    isNotEmpty: CODIGOS_ERRO.DATA_FIM_INVALIDA,
    isDateString: CODIGOS_ERRO.DATA_FIM_INVALIDA,
    matches: CODIGOS_ERRO.DATA_FIM_INVALIDA,
  },
  tipo: {
    isNotEmpty: CODIGOS_ERRO.TIPO_PASSAGEM_INVALIDO,
    isIn: CODIGOS_ERRO.TIPO_PASSAGEM_INVALIDO,
    isEnum: CODIGOS_ERRO.TIPO_PASSAGEM_INVALIDO,
  },
  dataHoraChegada: {
    isNotEmpty: CODIGOS_ERRO.CHEGADA_ANTERIOR_PARTIDA,
    isDateString: CODIGOS_ERRO.CHEGADA_ANTERIOR_PARTIDA,
  },
  dataHoraCheckout: {
    isNotEmpty: CODIGOS_ERRO.CHECKOUT_ANTERIOR_CHECKIN,
    isDateString: CODIGOS_ERRO.CHECKOUT_ANTERIOR_CHECKIN,
  },
  valorTotal: {
    isNotEmpty: CODIGOS_ERRO.VALOR_TOTAL_OBRIGATORIO,
    isNumber: CODIGOS_ERRO.VALOR_TOTAL_OBRIGATORIO,
    min: CODIGOS_ERRO.VALOR_NEGATIVO,
  },
  valor: { min: CODIGOS_ERRO.VALOR_NEGATIVO, isNumber: CODIGOS_ERRO.VALOR_NEGATIVO },
  custo: { min: CODIGOS_ERRO.VALOR_NEGATIVO, isNumber: CODIGOS_ERRO.VALOR_NEGATIVO },
  valorNoite: { min: CODIGOS_ERRO.VALOR_NEGATIVO, isNumber: CODIGOS_ERRO.VALOR_NEGATIVO },
  noites: { min: CODIGOS_ERRO.VALOR_NEGATIVO, isInt: CODIGOS_ERRO.VALOR_NEGATIVO },
  duracaoEstimada: { min: CODIGOS_ERRO.VALOR_NEGATIVO, isInt: CODIGOS_ERRO.VALOR_NEGATIVO },
  page: { isInt: CODIGOS_ERRO.PAGINACAO_INVALIDA, min: CODIGOS_ERRO.PAGINACAO_INVALIDA },
  size: {
    isInt: CODIGOS_ERRO.PAGINACAO_INVALIDA,
    min: CODIGOS_ERRO.PAGINACAO_INVALIDA,
    max: CODIGOS_ERRO.PAGINACAO_INVALIDA,
  },
};

/**
 * Ordem canônica de exibição dos campos no array de erro (espelha a ordem dos
 * formulários em UI_SPEC §5 e §7). Campos fora da lista vão para o fim,
 * preservando a ordem de origem.
 */
const ORDEM_CAMPOS = [
  'nome',
  'email',
  'senha',
  'destino',
  'dataInicio',
  'dataFim',
  'moeda',
  'tipo',
  'origem',
  'dataHoraPartida',
  'dataHoraChegada',
  'companhia',
  'localizador',
  'valor',
  'endereco',
  'cidade',
  'categoria',
  'horarioPrevisto',
  'duracaoEstimada',
  'custo',
  'observacoes',
  'dataHoraCheckin',
  'dataHoraCheckout',
  'valorNoite',
  'noites',
  'valorTotal',
  'reserva',
  'viagemId',
  'diaId',
  'itemId',
  'page',
  'size',
];

function codigoDoErro(campo: string, constraint: string): string {
  return CODIGO_POR_CAMPO[campo]?.[constraint] ?? CODIGOS_ERRO.CAMPO_OBRIGATORIO;
}

function achatar(erros: ValidationError[], prefixo = ''): Array<{ campo: string; erro: ValidationError }> {
  return erros.flatMap((erro) => {
    const campo = prefixo ? `${prefixo}.${erro.property}` : erro.property;
    const filhos = erro.children?.length ? achatar(erro.children, campo) : [];
    return [{ campo, erro }, ...filhos];
  });
}

function constraintEscolhida(erro: ValidationError): { nome: string; mensagem: string } | null {
  const constraints = erro.constraints ?? {};
  const nomes = Object.keys(constraints);
  if (nomes.length === 0) {
    return null;
  }
  const nome =
    PRIORIDADE_CONSTRAINTS.find((candidata) => nomes.includes(candidata)) ??
    nomes.sort((a, b) => a.localeCompare(b))[0];
  return { nome, mensagem: constraints[nome] };
}

function ordemDoCampo(campo: string): number {
  const indice = ORDEM_CAMPOS.indexOf(campo);
  return indice === -1 ? ORDEM_CAMPOS.length : indice;
}

/**
 * Converte o resultado do `class-validator` no envelope de erro do contrato
 * (`400` com um item por campo inválido).
 */
export function mapearErrosDeValidacao(erros: ValidationError[]): ApiErrorDetail[] {
  const detalhes: ApiErrorDetail[] = [];

  for (const { campo, erro } of achatar(erros)) {
    const constraint = constraintEscolhida(erro);
    if (!constraint) {
      continue;
    }
    detalhes.push({
      id: codigoDoErro(campo, constraint.nome),
      message: constraint.mensagem,
      field: campo,
      detail: null,
    });
  }

  return detalhes.sort((a, b) => ordemDoCampo(a.field ?? '') - ordemDoCampo(b.field ?? ''));
}

/** `exceptionFactory` do `ValidationPipe`: 400 com o envelope em array. */
export function validationExceptionFactory(erros: ValidationError[]): ApiException {
  return new ApiException(mapearErrosDeValidacao(erros), HttpStatus.BAD_REQUEST);
}
