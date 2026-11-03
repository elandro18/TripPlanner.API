import { Logger } from '@nestjs/common';
import { BancoConfig, descricaoDoBanco, validarDatabaseUrl } from './banco-de-dados';

/** Token de injeção da configuração da aplicação. */
export const APP_CONFIG = 'APP_CONFIG';

export interface JwtConfig {
  /** Segredo HMAC usado para assinar/validar o JWT (SECURITY.md §3). */
  readonly secret: string;
  /** Validade do token (ex.: `1h`). */
  readonly expiresIn: string;
  /** Custo do bcrypt no hash da senha. */
  readonly saltRounds: number;
}

export interface AppConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly apiPrefix: string;
  /** Origens liberadas no CORS (frontend). */
  readonly corsOrigins: string[];
  /** URL do PostgreSQL (`DATABASE_URL`), usada pelo driver adapter do Prisma. */
  readonly databaseUrl: string;
  /** Conexão validada (`null` apenas nos testes, que usam PGlite). */
  readonly banco: BancoConfig | null;
  /** Swagger UI/JSON habilitado (padrão: ligado fora de produção). */
  readonly swaggerEnabled: boolean;
  /** URL pública da API, publicada em `servers` no OpenAPI. */
  readonly publicApiUrl: string | null;
  readonly jwt: JwtConfig;
}

const JWT_SECRET_DEV = 'tripplanner-dev-secret-nao-usar-em-producao';
const logger = new Logger('AppConfig');

function texto(valor: string | undefined, padrao: string): string {
  const normalizado = valor?.trim();
  return normalizado && normalizado.length > 0 ? normalizado : padrao;
}

function inteiro(valor: string | undefined, padrao: number, nome: string): number {
  const bruto = valor?.trim();
  if (!bruto) {
    return padrao;
  }
  const numero = Number(bruto);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`Variável de ambiente ${nome} deve ser um inteiro positivo (recebido: "${bruto}")`);
  }
  return numero;
}

function lista(valor: string | undefined, padrao: string[]): string[] {
  const itens = (valor ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return itens.length > 0 ? itens : padrao;
}

function booleano(valor: string | undefined, padrao: boolean, nome: string): boolean {
  const bruto = valor?.trim().toLowerCase();
  if (!bruto) {
    return padrao;
  }
  if (['true', '1', 'yes', 'on'].includes(bruto)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(bruto)) {
    return false;
  }
  throw new Error(`Variável de ambiente ${nome} deve ser true ou false (recebido: "${valor}")`);
}

/**
 * Monta a configuração a partir das variáveis de ambiente.
 *
 * A `DATABASE_URL` é validada aqui (ver `banco-de-dados.ts`): em produção não
 * pode ser local, em desenvolvimento não pode ser remota sem `ALLOW_REMOTE_DB`.
 * Nos testes (`NODE_ENV=test`) a validação é ignorada — o banco é o PGlite em
 * memória injetado pelo adapter.
 */
export function carregarConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = texto(env.NODE_ENV, 'development');
  const jwtSecret = env.JWT_SECRET?.trim();

  if (!jwtSecret && nodeEnv === 'production') {
    throw new Error('JWT_SECRET é obrigatório em produção (SECURITY.md §3)');
  }
  if (!jwtSecret) {
    logger.warn('JWT_SECRET não definido — usando segredo de desenvolvimento. Não usar em produção.');
  }

  const banco = nodeEnv === 'test' ? null : validarDatabaseUrl(env.DATABASE_URL, nodeEnv, env);

  if (banco) {
    logger.log(`Ambiente "${nodeEnv}" usando banco ${descricaoDoBanco(banco)}`);
    if (!banco.local && !banco.ssl) {
      logger.warn(`Banco remoto ${banco.host} sem SSL na URL — o Neon exige sslmode=require.`);
    }
  }

  return {
    nodeEnv,
    port: inteiro(env.PORT, 3000, 'PORT'),
    apiPrefix: texto(env.API_PREFIX, 'api/v1'),
    corsOrigins: lista(env.CORS_ORIGINS, ['http://localhost:5173']),
    databaseUrl: env.DATABASE_URL?.trim() ?? '',
    banco,
    swaggerEnabled: booleano(env.SWAGGER_ENABLED, nodeEnv !== 'production', 'SWAGGER_ENABLED'),
    publicApiUrl: env.PUBLIC_API_URL?.trim() || null,
    jwt: {
      secret: jwtSecret && jwtSecret.length > 0 ? jwtSecret : JWT_SECRET_DEV,
      expiresIn: texto(env.JWT_EXPIRES_IN, '1h'),
      saltRounds: inteiro(env.BCRYPT_SALT_ROUNDS, 10, 'BCRYPT_SALT_ROUNDS'),
    },
  };
}
