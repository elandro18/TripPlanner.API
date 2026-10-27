import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponse, UsuarioAutenticadoResponse, UsuarioDaRequisicao } from './auth.types';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { LoginDto } from './dto/login.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Endpoints de autenticação (`specs/API_CONTRACTS.md` §1).
 *
 * O prefixo global `/api/v1` é aplicado em `app.setup.ts`, resultando em
 * `/api/v1/auth/...`.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** §1.1 — `POST /api/v1/auth/registrar` → 201 `{ id, nome, email, token }` (RN-001). */
  @Post('registrar')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() dto: RegistrarDto): Promise<AuthResponse> {
    return this.auth.registrar(dto);
  }

  /** §1.2 — `POST /api/v1/auth/login` → 200 `{ id, nome, email, token }` (RN-002). */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  /** §1.3 — `POST /api/v1/auth/logout` → 204 (RN-003). */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  async logout(@UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<void> {
    await this.auth.logout(usuario.jti, usuario.exp);
  }

  /** §1.4 — `GET /api/v1/auth/me` → 200 `{ id, nome, email, ativo }`. */
  @Get('me')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  me(@UsuarioAtual() usuario: UsuarioDaRequisicao): Promise<UsuarioAutenticadoResponse> {
    return this.auth.usuarioAutenticado(usuario.id);
  }
}
