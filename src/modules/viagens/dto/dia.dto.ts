import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Criação manual de um dia (viagens sem datas ou dia extra). */
export class CriarDiaDto {
  @ApiPropertyOptional({ example: '2026-05-16', description: 'Data do dia (AAAA-MM-DD). Omitida em viagens sem datas.' })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data do dia deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data do dia inválida' })
  data?: string;

  @ApiPropertyOptional({ example: 'Dia livre no centro', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Título inválido' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  titulo?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Destino ao qual o dia pertence.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Destino inválido' })
  @Min(1, { message: 'Destino inválido' })
  destinoId?: number;
}

/** Edição de um dia (renumerar, mover data, título ou destino). */
export class AtualizarDiaDto {
  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número do dia deve ser inteiro' })
  @Min(1, { message: 'Número do dia deve ser maior que zero' })
  numeroDia?: number;

  @ApiPropertyOptional({ example: '2026-05-13', description: 'Nova data (AAAA-MM-DD) ou `null`.' })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data do dia deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data do dia inválida' })
  data?: string | null;

  @ApiPropertyOptional({ example: 'Gramado — dia 2', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Título inválido' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  titulo?: string | null;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Destino inválido' })
  @Min(1, { message: 'Destino inválido' })
  destinoId?: number | null;
}
