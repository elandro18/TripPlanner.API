import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { validationExceptionFactory } from './common/pipes/validation-exception.factory';
import { configurarSwagger } from './config/swagger.setup';

/**
 * Configuração comum de bootstrap (prefixo, validação, filtro de erro, Swagger).
 *
 * Compartilhada entre `main.ts` e os testes e2e para que a aplicação testada
 * seja a mesma que sobe em execução.
 */
export function configurarApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);

  app.setGlobalPrefix(config.apiPrefix);
  configurarSwagger(app);
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}
