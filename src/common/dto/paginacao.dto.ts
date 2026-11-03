import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const PAGE_PADRAO = 0;
export const SIZE_PADRAO = 20;
export const SIZE_MAXIMO = 100;

/**
 * Parâmetros de paginação **offset** das listagens
 * (`specs/API_CONTRACTS.md` § "Envelope de Resposta — Listagens (offset)").
 *
 * Valores inválidos → `ERR-016` (400) via `validationExceptionFactory`.
 */
export class PaginacaoQueryDto {
  @ApiPropertyOptional({ example: 0, default: PAGE_PADRAO, minimum: 0, description: 'Página (base 0).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parâmetro de paginação inválido' })
  @Min(0, { message: 'Parâmetro de paginação inválido' })
  page: number = PAGE_PADRAO;

  @ApiPropertyOptional({
    example: SIZE_PADRAO,
    default: SIZE_PADRAO,
    minimum: 1,
    maximum: SIZE_MAXIMO,
    description: 'Itens por página (1..100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Parâmetro de paginação inválido' })
  @Min(1, { message: 'Parâmetro de paginação inválido' })
  @Max(SIZE_MAXIMO, { message: 'Parâmetro de paginação inválido' })
  size: number = SIZE_PADRAO;
}
