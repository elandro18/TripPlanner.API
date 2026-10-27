import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { TIPOS_ITEM_ROTEIRO, TipoItemRoteiro } from '../roteiro.model';

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CriarRoteiroDto {
  @IsIn([...TIPOS_ITEM_ROTEIRO], { message: 'Tipo do item inválido (use LOCAL, PASSAGEM ou HOTEL)' })
  tipo: TipoItemRoteiro;

  @Type(() => Number)
  @IsInt({ message: 'Item inválido' })
  @Min(1, { message: 'Item inválido' })
  itemId: number;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de início deve estar no formato HH:MM' })
  horarioInicio?: string;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string;
}

export class AtualizarRoteiroDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Dia inválido' })
  @Min(1, { message: 'Dia inválido' })
  diaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de início deve estar no formato HH:MM' })
  horarioInicio?: string | null;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'concluido deve ser booleano' })
  concluido?: boolean;
}

class OrdemRoteiroDto {
  @Type(() => Number)
  @IsInt({ message: 'Card inválido' })
  id: number;

  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem: number;
}

export class ReordenarRoteiroDto {
  @IsArray({ message: 'ordens deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ordens não pode ser vazio' })
  @ValidateNested({ each: true })
  @Type(() => OrdemRoteiroDto)
  ordens: OrdemRoteiroDto[];
}
