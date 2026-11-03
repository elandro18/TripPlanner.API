import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export class CriarDestinoDto {
  @ApiProperty({ example: 'Gramado', maxLength: 150, description: 'Nome do destino.' })
  @IsNotEmpty({ message: 'Nome do destino é obrigatório' })
  @IsString({ message: 'Nome do destino é obrigatório' })
  @MaxLength(150, { message: 'Nome do destino deve ter no máximo 150 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: 'Gramado', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  cidade?: string;

  @ApiPropertyOptional({ example: 'Brasil', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'País inválido' })
  @MaxLength(100, { message: 'País deve ter no máximo 100 caracteres' })
  pais?: string;

  @ApiPropertyOptional({ example: '2026-05-12', description: 'Início da estadia (AAAA-MM-DD).' })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data de início deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de início inválida' })
  dataInicio?: string;

  @ApiPropertyOptional({ example: '2026-05-13', description: 'Fim da estadia (AAAA-MM-DD).' })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data de fim deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de fim inválida' })
  dataFim?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, description: 'Posição na ordem dos destinos.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @ApiPropertyOptional({ example: -29.3785, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90, { message: 'Latitude deve estar entre -90 e 90' })
  @Max(90, { message: 'Latitude deve estar entre -90 e 90' })
  lat?: number;

  @ApiPropertyOptional({ example: -50.8727, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180, { message: 'Longitude deve estar entre -180 e 180' })
  @Max(180, { message: 'Longitude deve estar entre -180 e 180' })
  lng?: number;
}

export class AtualizarDestinoDto extends CriarDestinoDto {}

export class ReordenarDestinosDto {
  @ApiProperty({
    type: [Number],
    example: [3, 1, 2],
    description: 'Ids dos destinos na nova ordem.',
  })
  @IsArray({ message: 'ids deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ids não pode ser vazio' })
  @IsInt({ each: true, message: 'Cada id deve ser inteiro' })
  ids: number[];
}
