import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Login (RN-002) — `POST /api/v1/auth/login`. */
export class LoginDto {
  @ApiProperty({ example: 'demo@tripplanner.local', description: 'E-mail cadastrado.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @MaxLength(150, { message: 'E-mail deve ter no máximo 150 caracteres' })
  email: string;

  @ApiProperty({ example: 'demo1234', description: 'Senha cadastrada.' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha é obrigatória' })
  @MaxLength(255, { message: 'Senha deve ter no máximo 255 caracteres' })
  senha: string;
}
