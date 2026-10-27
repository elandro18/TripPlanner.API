import { ApiErrorDetail } from './api-error';
import { CODIGOS_ERRO, CodigoErro } from './error-codes';

/**
 * Erro de domínio: erro **esperado** pela regra de negócio, identificado por um
 * código do catálogo (`specs/ERROR_CATALOG.md`).
 *
 * É agnóstico de transporte — nem serviço nem adaptador (ACL) conhecem HTTP. O
 * `ApiExceptionFilter` traduz o código para o status HTTP correspondente
 * (`error-status.ts`) e para o envelope de erro em array.
 */
export abstract class DominioError extends Error {
  protected constructor(
    readonly codigo: CodigoErro,
    message: string,
    readonly campo: string | null = null,
    readonly detalhe: string | null = null,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  paraDetalhe(): ApiErrorDetail {
    return { id: this.codigo, message: this.message, field: this.campo, detail: this.detalhe };
  }
}

// --------------------------------------------------------------------------
// Validação / regras de campo (400)
// --------------------------------------------------------------------------

/** ERR-001 — campo obrigatório não informado (RN-028). */
export class CampoObrigatorioError extends DominioError {
  constructor(campo: string) {
    super(CODIGOS_ERRO.CAMPO_OBRIGATORIO, `Campo obrigatório: ${campo}`, campo);
  }
}

/** ERR-007 — data de fim anterior à data de início (RN-005). */
export class DataFimInvalidaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.DATA_FIM_INVALIDA, 'Data de fim deve ser maior ou igual à data de início', 'dataFim');
  }
}

/** ERR-010 — chegada anterior à partida (RN-013). */
export class ChegadaAnteriorPartidaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.CHEGADA_ANTERIOR_PARTIDA, 'Chegada deve ser maior ou igual à partida', 'dataHoraChegada');
  }
}

/** ERR-011 — valor negativo (RN-012, RN-013). */
export class ValorNegativoError extends DominioError {
  constructor(campo = 'valor') {
    super(CODIGOS_ERRO.VALOR_NEGATIVO, 'Valor não pode ser negativo', campo);
  }
}

/** ERR-012 — check-out anterior ao check-in (RN-016). */
export class CheckoutAnteriorCheckinError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.CHECKOUT_ANTERIOR_CHECKIN, 'Check-out deve ser maior ou igual ao check-in', 'dataHoraCheckout');
  }
}

/** ERR-013 — valor total do hotel não informado nem calculável (RN-016, RN-017). */
export class ValorTotalObrigatorioError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.VALOR_TOTAL_OBRIGATORIO, 'Valor total é obrigatório', 'valorTotal');
  }
}

/** ERR-016 — paginação inválida (page/size). */
export class PaginacaoInvalidaError extends DominioError {
  constructor(campo = 'page') {
    super(CODIGOS_ERRO.PAGINACAO_INVALIDA, 'Parâmetro de paginação inválido', campo);
  }
}

// --------------------------------------------------------------------------
// Autenticação e autorização (401/403)
// --------------------------------------------------------------------------

/** ERR-030 — e-mail ou senha inválidos (RN-002). */
export class CredenciaisInvalidasError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.CREDENCIAIS_INVALIDAS, 'Credenciais inválidas (e-mail ou senha)');
  }
}

/** ERR-031 — token ausente, inválido, expirado ou revogado (RN-002, RN-003). */
export class TokenInvalidoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.TOKEN_INVALIDO, 'Token ausente ou inválido');
  }
}

/** ERR-032 — acesso a recurso de outro usuário (RN-004). */
export class AcessoNegadoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.ACESSO_NEGADO, 'Acesso negado a recurso de outro usuário');
  }
}

// --------------------------------------------------------------------------
// Negócio (409)
// --------------------------------------------------------------------------

/** ERR-040 — e-mail já cadastrado (RN-001). */
export class EmailJaCadastradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.EMAIL_JA_CADASTRADO, 'E-mail já cadastrado', 'email');
  }
}

/** ERR-041 — já existe viagem ativa para o usuário (RN-006). */
export class ViagemAtivaDuplicadaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.VIAGEM_ATIVA_DUPLICADA, 'Já existe uma viagem ativa para este usuário', 'ativa');
  }
}

/** ERR-042 — o mesmo item já está vinculado ao dia (RN-019). */
export class ItemJaNoDiaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.ITEM_JA_NO_DIA, 'Item já vinculado a este dia', 'itemId');
  }
}

/** ERR-043 — o item referenciado pertence a outra viagem. */
export class ItemNaoPertenceAViagemError extends DominioError {
  constructor() {
    super(
      CODIGOS_ERRO.ITEM_NAO_PERTENCE_A_VIAGEM,
      'Item não pertence à viagem informada',
      'itemId',
    );
  }
}

/** ERR-050 — atividade com horário sobreposto no mesmo dia (RN-021). */
export class ConflitoHorarioError extends DominioError {
  constructor() {
    super(
      CODIGOS_ERRO.CONFLITO_HORARIO,
      'Horário conflita com outra atividade do dia',
      'horarioInicio',
    );
  }
}

// --------------------------------------------------------------------------
// Recurso não encontrado (404)
// --------------------------------------------------------------------------

/** ERR-060 — viagem não encontrada (RN-004, RN-007). */
export class ViagemNaoEncontradaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.VIAGEM_NAO_ENCONTRADA, 'Viagem não encontrada', 'id');
  }
}

/** ERR-061 — dia não encontrado (RN-008). */
export class DiaNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.DIA_NAO_ENCONTRADO, 'Dia não encontrado', 'id');
  }
}

/** ERR-062 — local não encontrado (RN-011). */
export class LocalNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.LOCAL_NAO_ENCONTRADO, 'Local não encontrado', 'id');
  }
}

/** ERR-063 — passagem não encontrada (RN-015). */
export class PassagemNaoEncontradaError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.PASSAGEM_NAO_ENCONTRADA, 'Passagem não encontrada', 'id');
  }
}

/** ERR-064 — hotel não encontrado (RN-018). */
export class HotelNaoEncontradoError extends DominioError {
  constructor() {
    super(CODIGOS_ERRO.HOTEL_NAO_ENCONTRADO, 'Hotel não encontrado', 'id');
  }
}

// --------------------------------------------------------------------------
// Integração (502)
// --------------------------------------------------------------------------

/** ERR-070 — falha ao acessar a planilha-base do Google Drive (RN-029..RN-032). */
export class PlanilhaIndisponivelError extends DominioError {
  constructor(detalhe: string | null = null) {
    super(CODIGOS_ERRO.PLANILHA_INDISPONIVEL, 'Falha ao acessar a planilha-base (Google Drive)', null, detalhe);
  }
}
