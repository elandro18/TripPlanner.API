import { carregarConfig } from '../src/config/app-config';
import { descricaoDoBanco } from '../src/config/banco-de-dados';
import { carregarEnv } from '../src/config/load-env';

/**
 * Diagnóstico do ambiente (`npm run env:check`).
 *
 * Mostra quais arquivos `.env` foram carregados e se a `DATABASE_URL` é válida
 * para o `NODE_ENV` atual — sem imprimir senha.
 */
const env = carregarEnv();

console.log('');
console.log(`Ambiente: ${env.ambiente}`);
console.log(
  `Arquivos .env carregados: ${env.carregados.length > 0 ? env.carregados.join(', ') : 'nenhum (variáveis do host)'}`,
);
if (env.ausentes.length > 0 && env.carregados.length === 0) {
  console.log(`Arquivos procurados (ausentes): ${env.ausentes.join(', ')}`);
}

try {
  const config = carregarConfig();
  console.log(`Porta: ${config.port} · prefixo: /${config.apiPrefix}`);
  console.log(`Banco: ${config.banco ? descricaoDoBanco(config.banco) : 'nenhum (NODE_ENV=test)'}`);
  console.log(`Swagger habilitado: ${config.swaggerEnabled ? 'sim' : 'não'}`);
  console.log(`CORS: ${config.corsOrigins.join(', ')}`);
  console.log('');
  console.log('Ambiente OK.');
} catch (erro) {
  console.error('');
  console.error(`Ambiente inválido: ${(erro as Error).message}`);
  process.exit(1);
}
