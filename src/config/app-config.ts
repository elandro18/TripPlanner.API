import { Logger } from '@nestjs/common';

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

/**
 * Monta a configuração a partir das variáveis de ambiente.
 *
 * O `DATABASE_URL` é a connection string do PostgreSQL; não há mais padrão
 * local (o `PrismaService` falha na subida quando ela não está definida).
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

  return {
    nodeEnv,
    port: inteiro(env.PORT, 3000, 'PORT'),
    apiPrefix: texto(env.API_PREFIX, 'api/v1'),
    corsOrigins: lista(env.CORS_ORIGINS, ['http://localhost:5173']),
    databaseUrl: env.DATABASE_URL?.trim() ?? '',
    jwt: {
      secret: jwtSecret && jwtSecret.length > 0 ? jwtSecret : JWT_SECRET_DEV,
      expiresIn: texto(env.JWT_EXPIRES_IN, '1h'),
      saltRounds: inteiro(env.BCRYPT_SALT_ROUNDS, 10, 'BCRYPT_SALT_ROUNDS'),
    },
  };
}
