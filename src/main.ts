import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { carregarEnv } from './config/load-env';

async function bootstrap(): Promise<void> {
  carregarEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  configurarApp(app);

  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port);

  Logger.log(`TripPlanner.API ouvindo em http://localhost:${config.port}/${config.apiPrefix}`, 'Bootstrap');
}

void bootstrap().catch((erro: unknown) => {
  Logger.error(`Falha ao subir a aplicação: ${(erro as Error)?.message ?? String(erro)}`, (erro as Error)?.stack, 'Bootstrap');
  process.exit(1);
});
