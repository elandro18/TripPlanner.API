import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const URL_HTTP = { protocols: ['http', 'https'], require_protocol: true };

export class CriarListaDto {
  @ApiProperty({ example: 'Documentos da viagem', maxLength: 100 })
  @IsNotEmpty({ message: 'Nome da lista é obrigatório' })
  @IsString({ message: 'Nome da lista é obrigatório' })
  @MaxLength(100, { message: 'Nome da lista deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: 'Documentos', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(50, { message: 'Categoria deve ter no máximo 50 caracteres' })
  categoria?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Viagem associada (opcional).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number;
}

export class AtualizarListaDto {
  @ApiPropertyOptional({ example: 'Documentos e reservas', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Nome inválido' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: 'Documentos', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(50, { message: 'Categoria deve ter no máximo 50 caracteres' })
  categoria?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Nova viagem ou `null` para desvincular.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number | null;
}

export class CriarListaItemDto {
  @ApiProperty({ example: 'Passaporte', maxLength: 150 })
  @IsNotEmpty({ message: 'Nome do item é obrigatório' })
  @IsString({ message: 'Nome do item é obrigatório' })
  @MaxLength(150, { message: 'Nome do item deve ter no máximo 150 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: 'documento', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Tipo inválido' })
  @MaxLength(50, { message: 'Tipo deve ter no máximo 50 caracteres' })
  tipo?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, description: 'Valor em reais.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number;

  @ApiPropertyOptional({ example: 120, minimum: 0, description: 'Valor previsto em reais.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor previsto deve ser numérico' })
  @Min(0, { message: 'Valor previsto não pode ser negativo' })
  valorPrevisto?: number;

  @ApiPropertyOptional({ example: 120, minimum: 0, description: 'Valor efetivamente pago em reais.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago deve ser numérico' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  valorPago?: number;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00Z', description: 'Data do pagamento (ISO 8601).' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento inválida' })
  pagoEm?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'concluído deve ser booleano' })
  concluido?: boolean;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00Z', description: 'Data de conclusão (ISO 8601).' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de conclusão inválida' })
  concluidoEm?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/passaporte/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Marca o item como refeição (campos de local/fotos de prato).' })
  @IsOptional()
  @IsBoolean({ message: 'refeicao deve ser booleano' })
  refeicao?: boolean;

  @ApiPropertyOptional({ example: 'Rua Bela Vista, 100', maxLength: 200 })
  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200)
  endereco?: string;

  @ApiPropertyOptional({ example: 'Gramado', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100)
  cidade?: string;

  @ApiPropertyOptional({ example: -29.3741, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: -50.8747, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/prato/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto do prato inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do prato deve ser uma URL http(s) válida' })
  fotoPratoUrl?: string;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/local/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto do local inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do local deve ser uma URL http(s) válida' })
  fotoLocalUrl?: string;

  @ApiPropertyOptional({ example: 'Reservar com antecedência.', maxLength: 500 })
  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500)
  observacoes?: string;
}

export class AtualizarListaItemDto {
  @ApiPropertyOptional({ example: 'Passaporte e RG', maxLength: 150 })
  @IsOptional()
  @IsString({ message: 'Nome inválido' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: 'documento', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Tipo inválido' })
  @MaxLength(50)
  tipo?: string | null;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number | null;

  @ApiPropertyOptional({ example: 120, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor previsto deve ser numérico' })
  @Min(0, { message: 'Valor previsto não pode ser negativo' })
  valorPrevisto?: number | null;

  @ApiPropertyOptional({ example: 120, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago deve ser numérico' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  valorPago?: number | null;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento inválida' })
  pagoEm?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'concluído deve ser booleano' })
  concluido?: boolean;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de conclusão inválida' })
  concluidoEm?: string | null;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/passaporte/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'refeicao deve ser booleano' })
  refeicao?: boolean;

  @ApiPropertyOptional({ example: 'Rua Bela Vista, 100', maxLength: 200 })
  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200)
  endereco?: string | null;

  @ApiPropertyOptional({ example: 'Gramado', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100)
  cidade?: string | null;

  @ApiPropertyOptional({ example: -29.3741, minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90)
  @Max(90)
  lat?: number | null;

  @ApiPropertyOptional({ example: -50.8747, minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180)
  @Max(180)
  lng?: number | null;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/prato/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto do prato inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do prato deve ser uma URL http(s) válida' })
  fotoPratoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/local/600/400' })
  @IsOptional()
  @IsString({ message: 'Foto do local inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do local deve ser uma URL http(s) válida' })
  fotoLocalUrl?: string | null;

  @ApiPropertyOptional({ example: 'Reservar com antecedência.', maxLength: 500 })
  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500)
  observacoes?: string | null;
}

class OrdemItemDto {
  @ApiProperty({ example: 1, description: 'Id do item.' })
  @Type(() => Number)
  @IsInt({ message: 'Item inválido' })
  id: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem: number;
}

export class ReordenarListaItensDto {
  @ApiProperty({ type: [OrdemItemDto], description: 'Itens na nova ordem.' })
  @IsArray({ message: 'ordens deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ordens não pode ser vazio' })
  @ValidateNested({ each: true })
  @Type(() => OrdemItemDto)
  ordens: OrdemItemDto[];
}

/** Filtro opcional da listagem de listas. */
export class ListarListasQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Filtra pelas listas da viagem informada.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number;
}
