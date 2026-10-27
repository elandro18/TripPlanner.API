import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig, carregarConfig } from './app-config';

/**
 * Configuração da aplicação exposta por injeção de dependência.
 *
 * Substitui o `@nestjs/config` (não disponível no feed npm interno) mantendo o
 * mesmo contrato de uso: provedor global com token `APP_CONFIG`.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => carregarConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
