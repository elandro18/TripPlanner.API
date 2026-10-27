import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import { PersistenciaModule } from '../../persistencia/persistencia.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenRevocationService } from './token-revocation.service';

/**
 * Módulo de Autenticação (ARCHITECTURE §4).
 *
 * Exporta o `JwtModule`, o guard e o serviço de revogação para que os módulos de
 * domínio protejam seus endpoints e filtrem pelo dono do recurso (RN-004).
 */
@Module({
  imports: [
    PersistenciaModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenRevocationService, JwtAuthGuard],
  exports: [AuthService, TokenRevocationService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
