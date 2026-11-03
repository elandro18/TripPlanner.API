import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Cadastro de usuário (RN-001) — `POST /api/v1/auth/registrar`.
 *
 * As mensagens reproduzem o texto do `ERROR_CATALOG.md` (ERR-002..ERR-005).
 */
export class RegistrarDto {
  @ApiProperty({ example: 'Ana Beatriz Moraes', maxLength: 100, description: 'Nome do usuário.' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({ example: 'ana@exemplo.com', maxLength: 150, description: 'E-mail único (login).' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @MaxLength(150, { message: 'E-mail deve ter no máximo 150 caracteres' })
  email: string;

  @ApiProperty({ example: 'senha1234', minLength: 6, maxLength: 255, description: 'Senha em texto puro (armazenada como hash).' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres' })
  @MaxLength(255, { message: 'Senha deve ter no máximo 255 caracteres' })
  senha: string;
}
