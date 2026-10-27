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
  @IsNotEmpty({ message: 'Nome do destino é obrigatório' })
  @IsString({ message: 'Nome do destino é obrigatório' })
  @MaxLength(150, { message: 'Nome do destino deve ter no máximo 150 caracteres' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  cidade?: string;

  @IsOptional()
  @IsString({ message: 'País inválido' })
  @MaxLength(100, { message: 'País deve ter no máximo 100 caracteres' })
  pais?: string;

  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data de início deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de início inválida' })
  dataInicio?: string;

  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data de fim deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de fim inválida' })
  dataFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90, { message: 'Latitude deve estar entre -90 e 90' })
  @Max(90, { message: 'Latitude deve estar entre -90 e 90' })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180, { message: 'Longitude deve estar entre -180 e 180' })
  @Max(180, { message: 'Longitude deve estar entre -180 e 180' })
  lng?: number;
}

export class AtualizarDestinoDto extends CriarDestinoDto {}

export class ReordenarDestinosDto {
  @IsArray({ message: 'ids deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ids não pode ser vazio' })
  @IsInt({ each: true, message: 'Cada id deve ser inteiro' })
  ids: number[];
}
