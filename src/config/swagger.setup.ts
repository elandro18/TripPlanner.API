import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Caminho da UI do Swagger (independente do prefixo global da API). */
export const SWAGGER_PATH = 'api/docs';

/**
 * Publica a especificação OpenAPI e o Swagger UI.
 *
 * A UI fica em `/api/docs` e o JSON em `/api/docs-json`. O botão "Authorize"
 * aceita o token JWT retornado por `POST /api/v1/auth/login` (esquema Bearer).
 */
export function configurarSwagger(app: INestApplication): void {
  const opcoes = new DocumentBuilder()
    .setTitle('TripPlanner.API')
    .setDescription('API REST do Trip Planner — contratos em `specs/API_CONTRACTS.md`.')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token retornado por `POST /api/v1/auth/login` (ou `/auth/registrar`).',
      },
      'bearer',
    )
    .addTag('auth', 'Registro, login, logout e sessão')
    .addTag('viagens', 'Viagens, dias, ativação e resumo')
    .addTag('destinos', 'Destinos da viagem')
    .addTag('locais', 'Locais e atrações')
    .addTag('passagens', 'Passagens (avião/trem/ônibus)')
    .addTag('hoteis', 'Hospedagens')
    .addTag('roteiro', 'Cards do Kanban')
    .addTag('listas', 'Checklists e itens')
    .build();

  const documento = SwaggerModule.createDocument(app, opcoes);
  SwaggerModule.setup(SWAGGER_PATH, app, documento, {
    swaggerOptions: { persistAuthorization: true },
  });
}
