import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_HTTP = { protocols: ['http', 'https'], require_protocol: true };

/**
 * Cadastro/edição de local (`specs/API_CONTRACTS.md` §4.2; UI_SPEC §7.1).
 *
 * `custo` é opcional e admite zero para locais gratuitos (RN-012).
 */
export class CriarLocalDto {
  @ApiProperty({ example: 'Lago Negro', maxLength: 150 })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome é obrigatório' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: 'Av. Borges de Medeiros, s/n', maxLength: 200 })
  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200, { message: 'Endereço deve ter no máximo 200 caracteres' })
  endereco?: string;

  @ApiPropertyOptional({ example: 'Gramado', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  cidade?: string;

  @ApiPropertyOptional({ example: 'natureza', maxLength: 30 })
  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(30, { message: 'Categoria deve ter no máximo 30 caracteres' })
  categoria?: string;

  @ApiPropertyOptional({ example: '10:30', description: 'Horário previsto (HH:MM).' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário previsto deve estar no formato HH:MM' })
  horarioPrevisto?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Horário de fim (HH:MM).' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Abertura do local (HH:MM).' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de abertura deve estar no formato HH:MM' })
  horarioAbertura?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'Fechamento do local (HH:MM).' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fechamento deve estar no formato HH:MM' })
  horarioFechamento?: string;

  @ApiPropertyOptional({ example: 90, minimum: 0, description: 'Duração estimada em minutos.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duração estimada deve ser um número inteiro de minutos' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  duracaoEstimada?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, description: 'Custo em reais (aceita zero).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Custo deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  custo?: number;

  @ApiPropertyOptional({ example: 'Levar casaco; pedalinhos opcionais.', maxLength: 500 })
  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  observacoes?: string;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/lago-negro/900/700' })
  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string;

  @ApiPropertyOptional({ example: -29.3792, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90, { message: 'Latitude deve estar entre -90 e 90' })
  @Max(90, { message: 'Latitude deve estar entre -90 e 90' })
  lat?: number;

  @ApiPropertyOptional({ example: -50.8769, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180, { message: 'Longitude deve estar entre -180 e 180' })
  @Max(180, { message: 'Longitude deve estar entre -180 e 180' })
  lng?: number;

  @ApiPropertyOptional({ enum: ['confirmado', 'aproximado', 'manual'], example: 'confirmado' })
  @IsOptional()
  @IsIn(['confirmado', 'aproximado', 'manual'], {
    message: 'geoStatus deve ser confirmado, aproximado ou manual',
  })
  geoStatus?: string;
}

export class AtualizarLocalDto extends CriarLocalDto {}
