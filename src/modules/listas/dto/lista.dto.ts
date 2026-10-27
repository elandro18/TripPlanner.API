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
  @IsNotEmpty({ message: 'Nome da lista é obrigatório' })
  @IsString({ message: 'Nome da lista é obrigatório' })
  @MaxLength(100, { message: 'Nome da lista deve ter no máximo 100 caracteres' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(50, { message: 'Categoria deve ter no máximo 50 caracteres' })
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number;
}

export class AtualizarListaDto {
  @IsOptional()
  @IsString({ message: 'Nome inválido' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(50, { message: 'Categoria deve ter no máximo 50 caracteres' })
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number | null;
}

export class CriarListaItemDto {
  @IsNotEmpty({ message: 'Nome do item é obrigatório' })
  @IsString({ message: 'Nome do item é obrigatório' })
  @MaxLength(150, { message: 'Nome do item deve ter no máximo 150 caracteres' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Tipo inválido' })
  @MaxLength(50, { message: 'Tipo deve ter no máximo 50 caracteres' })
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor previsto deve ser numérico' })
  @Min(0, { message: 'Valor previsto não pode ser negativo' })
  valorPrevisto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago deve ser numérico' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  valorPago?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento inválida' })
  pagoEm?: string;

  @IsOptional()
  @IsBoolean({ message: 'concluído deve ser booleano' })
  concluido?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Data de conclusão inválida' })
  concluidoEm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'refeicao deve ser booleano' })
  refeicao?: boolean;

  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200)
  endereco?: string;

  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100)
  cidade?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsString({ message: 'Foto do prato inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do prato deve ser uma URL http(s) válida' })
  fotoPratoUrl?: string;

  @IsOptional()
  @IsString({ message: 'Foto do local inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do local deve ser uma URL http(s) válida' })
  fotoLocalUrl?: string;

  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500)
  observacoes?: string;
}

export class AtualizarListaItemDto {
  @IsOptional()
  @IsString({ message: 'Nome inválido' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'Tipo inválido' })
  @MaxLength(50)
  tipo?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor previsto deve ser numérico' })
  @Min(0, { message: 'Valor previsto não pode ser negativo' })
  valorPrevisto?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor pago deve ser numérico' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  valorPago?: number | null;

  @IsOptional()
  @IsDateString({}, { message: 'Data de pagamento inválida' })
  pagoEm?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'concluído deve ser booleano' })
  concluido?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Data de conclusão inválida' })
  concluidoEm?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem?: number;

  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'refeicao deve ser booleano' })
  refeicao?: boolean;

  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200)
  endereco?: string | null;

  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100)
  cidade?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude inválida' })
  @Min(-90)
  @Max(90)
  lat?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude inválida' })
  @Min(-180)
  @Max(180)
  lng?: number | null;

  @IsOptional()
  @IsString({ message: 'Foto do prato inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do prato deve ser uma URL http(s) válida' })
  fotoPratoUrl?: string | null;

  @IsOptional()
  @IsString({ message: 'Foto do local inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto do local deve ser uma URL http(s) válida' })
  fotoLocalUrl?: string | null;

  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500)
  observacoes?: string | null;
}

class OrdemItemDto {
  @Type(() => Number)
  @IsInt({ message: 'Item inválido' })
  id: number;

  @Type(() => Number)
  @IsInt({ message: 'Ordem deve ser inteiro' })
  @Min(0, { message: 'Ordem não pode ser negativa' })
  ordem: number;
}

export class ReordenarListaItensDto {
  @IsArray({ message: 'ordens deve ser uma lista' })
  @ArrayNotEmpty({ message: 'ordens não pode ser vazio' })
  @ValidateNested({ each: true })
  @Type(() => OrdemItemDto)
  ordens: OrdemItemDto[];
}

/** Filtro opcional da listagem de listas. */
export class ListarListasQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Viagem inválida' })
  @Min(1, { message: 'Viagem inválida' })
  viagemId?: number;
}

