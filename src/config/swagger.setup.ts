import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { BancoConfig } from './banco-de-dados';

/** Caminho da UI do Swagger (independente do prefixo global da API). */
export const SWAGGER_PATH = 'api/docs';

/** Recorte da configuração necessário para montar a documentação. */
export interface SwaggerConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly publicApiUrl: string | null;
  readonly banco: BancoConfig | null;
}

function descreverAmbiente(config: SwaggerConfig): string {
  const banco = config.banco
    ? `${config.banco.host}:${config.banco.porta}/${config.banco.database}`
    : 'PGlite (testes)';
  return `Ambiente: **${config.nodeEnv}** · Banco: \`${banco}\``;
}

/**
 * Monta a especificação OpenAPI.
 *
 * Separado do `SwaggerModule.setup` para permitir exportar o `openapi.json`
 * (`npm run docs:export`) sem subir o servidor HTTP.
 */
export function criarDocumentoOpenApi(
  app: INestApplication,
  config: SwaggerConfig,
): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle('TripPlanner.API')
    .setDescription(
      [
        'API REST do Trip Planner — contratos em `specs/API_CONTRACTS.md`.',
        '',
        '### Como testar por aqui',
        '1. Execute `POST /api/v1/auth/login` (ou `POST /api/v1/auth/registrar`) e copie o `token` da resposta.',
        '2. Clique em **Authorize** e cole o token (sem o prefixo `Bearer`).',
        '3. Os endpoints autenticados passam a enviar `Authorization: Bearer <token>`.',
        '4. Use `GET /api/v1/health` para confirmar que a API e o banco respondem.',
        '',
        'A autorização fica salva entre recarregamentos (`persistAuthorization`).',
        '',
        descreverAmbiente(config),
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addServer(`http://localhost:${config.port}`, 'Local (desenvolvimento)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token retornado por `POST /api/v1/auth/login` (ou `/auth/registrar`).',
      },
      'bearer',
    )
    .addTag('health', 'Status da API e da conexão com o banco')
    .addTag('auth', 'Registro, login, logout e sessão')
    .addTag('viagens', 'Viagens, dias, ativação e resumo')
    .addTag('destinos', 'Destinos da viagem')
    .addTag('locais', 'Locais e atrações')
    .addTag('passagens', 'Passagens (avião/trem/ônibus)')
    .addTag('hoteis', 'Hospedagens')
    .addTag('roteiro', 'Cards do Kanban')
    .addTag('listas', 'Checklists e itens');

  if (config.publicApiUrl) {
    builder.addServer(config.publicApiUrl, 'Produção');
  }

  return SwaggerModule.createDocument(app, builder.build());
}

/**
 * Publica a especificação OpenAPI e o Swagger UI em `/api/docs`
 * (JSON em `/api/docs-json`).
 */
export function configurarSwagger(app: INestApplication, config: SwaggerConfig): void {
  const documento = criarDocumentoOpenApi(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, documento, {
    customSiteTitle: 'TripPlanner.API — Swagger',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });
}
