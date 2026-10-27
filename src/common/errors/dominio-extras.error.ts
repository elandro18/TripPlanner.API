import { CODIGOS_ERRO } from './error-codes';
import { DominioError } from './dominio.error';

/** ERR-065 — card do roteiro não encontrado. */
export class CardNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.CARD_NAO_ENCONTRADO, 'Card do roteiro não encontrado', 'id');
  }
}

/** ERR-001 — intervalo de horário inválido. */
export class HorarioInvalidoError extends DominioError {
  constructor(campo = 'horarioFim') {
    super(
      CODIGOS_ERRO.CAMPO_OBRIGATORIO,
      'Horário de fim deve ser posterior ao horário de início',
      campo,
    );
  }
}

/** ERR-066 — destino não encontrado. */
export class DestinoNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.DESTINO_NAO_ENCONTRADO, 'Destino não encontrado', 'id');
  }
}

/** ERR-067 — lista não encontrada. */
export class ListaNaoEncontradaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.LISTA_NAO_ENCONTRADA, 'Lista não encontrada', 'id');
  }
}

/** ERR-068 — item de lista não encontrado. */
export class ItemListaNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.ITEM_LISTA_NAO_ENCONTRADO, 'Item da lista não encontrado', 'id');
  }
}
