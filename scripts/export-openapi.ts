import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../src/app.module';
import { carregarConfig } from '../src/config/app-config';
import { carregarEnv } from '../src/config/load-env';
import { criarDocumentoOpenApi } from '../src/config/swagger.setup';

/**
 * Exporta a especificação OpenAPI para `openapi.json` (`npm run docs:export`).
 *
 * Não abre servidor nem conexão com banco: usa o modo `preview` do Nest e um
 * `DATABASE_URL` fictício só para instanciar o `PrismaService`. Útil para
 * importar no Postman/Insomnia ou versionar o contrato.
 */
process.env.NODE_ENV = 'test';
carregarEnv('development');
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://docs:docs@localhost:5432/docs';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'docs-export';

async function main(): Promise<void> {
  const config = carregarConfig();
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  app.setGlobalPrefix(config.apiPrefix);

  try {
    const documento = criarDocumentoOpenApi(app, config);
    const destino = resolve(process.cwd(), 'openapi.json');
    writeFileSync(destino, `${JSON.stringify(documento, null, 2)}\n`, 'utf8');
    const rotas = Object.keys(documento.paths).length;
    console.log(`OpenAPI exportado para ${destino} (${rotas} rotas).`);
  } finally {
    await app.close();
  }
}

void main().catch((erro: unknown) => {
  console.error(`Falha ao exportar o OpenAPI: ${(erro as Error)?.message ?? String(erro)}`);
  process.exit(1);
});
