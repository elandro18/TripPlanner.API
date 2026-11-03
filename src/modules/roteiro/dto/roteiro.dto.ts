import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ enum: [...TIPOS_ITEM_ROTEIRO], example: 'LOCAL', description: 'Tipo do item vinculado.' })
  @IsIn([...TIPOS_ITEM_ROTEIRO], { message: 'Tipo do item inválido (use LOCAL, PASSAGEM ou HOTEL)' })
  tipo: TipoItemRoteiro;

  @ApiProperty({ example: 1, minimum: 1, description: 'Id do item (local, passagem ou hotel).' })
  @Type(() => Number)
  @IsInt({ message: 'Item inválido' })
  @Min(1, { message: 'Item inválido' })
  itemId: number;

  @ApiPropertyOptional({ example: '10:30', description: 'Início do card (HH:MM). Sem valor, é sugerido pelo item.' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de início deve estar no formato HH:MM' })
  horarioInicio?: string;

  @ApiPropertyOptional({ example: '12:00', description: 'Fim do card (HH:MM).' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string;
}

export class AtualizarRoteiroDto {
  @ApiPropertyOptional({ example: 2, minimum: 1, description: 'Move o card para outro dia.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Dia inválido' })
  @Min(1, { message: 'Dia inválido' })
  diaId?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @ApiPropertyOptional({ example: '14:00', description: 'Novo início (HH:MM) ou `null` para limpar.' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de início deve estar no formato HH:MM' })
  horarioInicio?: string | null;

  @ApiPropertyOptional({ example: '15:30', description: 'Novo fim (HH:MM) ou `null` para limpar.' })
  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'concluido deve ser booleano' })
  concluido?: boolean;
}

class OrdemRoteiroDto {
  @ApiProperty({ example: 1, description: 'Id do card.' })
  @Type(() => Number)
  @IsInt({ message: 'Card inválido' })
  id: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem: number;
}

export class ReordenarRoteiroDto {
  @ApiProperty({ type: [OrdemRoteiroDto], description: 'Cards na nova ordem.' })
  @IsArray({ message: 'ordens deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ordens não pode ser vazio' })
  @ValidateNested({ each: true })
  @Type(() => OrdemRoteiroDto)
  ordens: OrdemRoteiroDto[];
}
