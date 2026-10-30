import { AppConfig } from '../../src/config/app-config';

/**
 * Configuração de teste: banco PostgreSQL em memória (PGlite) e custo de bcrypt
 * baixo para acelerar a suíte.
 */
export function criarConfigDeTeste(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    port: 3000,
    apiPrefix: 'api/v1',
    corsOrigins: ['http://localhost:5173'],
    databaseUrl: process.env.DATABASE_URL ?? '',
    jwt: { secret: 'segredo-de-testes', expiresIn: '1h', saltRounds: 4 },
    ...overrides,
  };
}
