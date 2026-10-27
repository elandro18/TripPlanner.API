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
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data do dia deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data do dia inválida' })
  data?: string;

  @IsOptional()
  @IsString({ message: 'Título inválido' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  titulo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Destino inválido' })
  @Min(1, { message: 'Destino inválido' })
  destinoId?: number;
}

/** Edição de um dia (renumerar, mover data, título ou destino). */
export class AtualizarDiaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número do dia deve ser inteiro' })
  @Min(1, { message: 'Número do dia deve ser maior que zero' })
  numeroDia?: number;

  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'Data do dia deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data do dia inválida' })
  data?: string | null;

  @IsOptional()
  @IsString({ message: 'Título inválido' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  titulo?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Destino inválido' })
  @Min(1, { message: 'Destino inválido' })
  destinoId?: number | null;
}
