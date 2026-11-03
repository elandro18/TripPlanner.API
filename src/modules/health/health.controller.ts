import { Controller, Get, HttpStatus, Inject, Logger, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PrismaService } from '../../persistencia/prisma/prisma.service';
import { HealthResponse } from './health.model';

/**
 * Health check da API e do banco.
 *
 * É o primeiro endpoint a abrir no Swagger: confirma que a aplicação subiu e
 * que o `DATABASE_URL` do ambiente (Postgres local ou Neon) está acessível.
 * Público (sem Bearer) por ser usado por monitoramento.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Status da API e da conexão com o banco',
    description:
      'Retorna 200 quando a API e o banco respondem. Retorna 503 quando a API está no ar mas o banco falhou.',
  })
  @ApiOkResponse({ description: 'API e banco respondendo.' })
  @ApiServiceUnavailableResponse({ description: 'API no ar, banco sem resposta.' })
  async verificar(@Res({ passthrough: true }) resposta: Response): Promise<HealthResponse> {
    const inicio = Date.now();
    const descricao = this.config.banco
      ? `${this.config.banco.host}:${this.config.banco.porta}/${this.config.banco.database}`
      : 'PGlite (testes)';
    const base = {
      aplicacao: 'TripPlanner.API',
      ambiente: this.config.nodeEnv,
      horario: new Date().toISOString(),
      uptimeSegundos: Math.round(process.uptime()),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ...base,
        status: 'ok',
        banco: { status: 'ok', latenciaMs: Date.now() - inicio, descricao },
      };
    } catch (erro) {
      this.logger.error(`Health check falhou: ${(erro as Error)?.message ?? String(erro)}`);
      resposta.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        ...base,
        status: 'degradado',
        banco: { status: 'erro', latenciaMs: null, descricao },
      };
    }
  }
}
