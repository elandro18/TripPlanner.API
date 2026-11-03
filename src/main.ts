import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { descricaoDoBanco } from './config/banco-de-dados';
import { carregarEnv } from './config/load-env';

async function bootstrap(): Promise<void> {
  const env = carregarEnv();
  const logger = new Logger('Bootstrap');
  logger.log(
    `Ambiente "${env.ambiente}" — arquivos .env carregados: ${
      env.carregados.length > 0 ? env.carregados.join(', ') : 'nenhum (variáveis do host)'
    }`,
  );

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  configurarApp(app);

  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port);

  logger.log(
    `TripPlanner.API ouvindo em http://localhost:${config.port}/${config.apiPrefix}`,
  );
  if (config.banco) {
    logger.log(`Banco: ${descricaoDoBanco(config.banco)}`);
  }
  if (config.swaggerEnabled) {
    logger.log(`Swagger: http://localhost:${config.port}/api/docs`);
  } else {
    logger.log('Swagger desabilitado (SWAGGER_ENABLED=false)');
  }
}

void bootstrap().catch((erro: unknown) => {
  Logger.error(`Falha ao subir a aplicação: ${(erro as Error)?.message ?? String(erro)}`, (erro as Error)?.stack, 'Bootstrap');
  process.exit(1);
});
