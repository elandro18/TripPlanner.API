import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TIPOS_PASSAGEM } from '../passagem.model';

/**
 * Cadastro/edição de passagem (`specs/API_CONTRACTS.md` §5.2; UI_SPEC §7.2).
 *
 * `tipo` é um enum fechado sem acento (RN-014); aceita minúsculas na entrada
 * (`aviao`, `trem`, `onibus`) e normaliza para maiúsculas. A chegada, quando
 * informada, não pode ser anterior à partida (ERR-010).
 */
export class CriarPassagemDto {
  @ApiProperty({ enum: [...TIPOS_PASSAGEM], example: 'AVIAO', description: 'Aceita minúsculas (normalizado para maiúsculas).' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn([...TIPOS_PASSAGEM], { message: 'Tipo de passagem inválido (use AVIAO, TREM ou ONIBUS)' })
  tipo: string;

  @ApiProperty({ example: 'São Paulo (GRU)', maxLength: 150 })
  @IsNotEmpty({ message: 'Campo obrigatório: origem' })
  @IsString({ message: 'Origem inválida' })
  @MaxLength(150, { message: 'Origem deve ter no máximo 150 caracteres' })
  origem: string;

  @ApiProperty({ example: 'Porto Alegre (POA)', maxLength: 150 })
  @IsNotEmpty({ message: 'Destino é obrigatório' })
  @IsString({ message: 'Destino é obrigatório' })
  @MaxLength(150, { message: 'Destino deve ter no máximo 150 caracteres' })
  destino: string;

  @ApiProperty({ example: '2026-05-12T08:20:00Z', description: 'Data/hora de partida (ISO 8601).' })
  @IsNotEmpty({ message: 'Campo obrigatório: dataHoraPartida' })
  @IsDateString({}, { message: 'Data/hora de partida inválida' })
  dataHoraPartida: string;

  @ApiPropertyOptional({ example: '2026-05-12T10:05:00Z', description: 'Data/hora de chegada (ISO 8601).' })
  @IsOptional()
  @IsDateString({}, { message: 'Data/hora de chegada inválida' })
  dataHoraChegada?: string;

  @ApiPropertyOptional({ example: 'Exemplo Air', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Companhia inválida' })
  @MaxLength(100, { message: 'Companhia deve ter no máximo 100 caracteres' })
  companhia?: string;

  @ApiPropertyOptional({ example: 'EXEMPLO-GRUPOA', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Localizador inválido' })
  @MaxLength(50, { message: 'Localizador deve ter no máximo 50 caracteres' })
  localizador?: string;

  @ApiPropertyOptional({ example: '1234567890', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Número do bilhete inválido' })
  @MaxLength(50, { message: 'Número do bilhete deve ter no máximo 50 caracteres' })
  numeroBilhete?: string;

  @ApiPropertyOptional({ example: 'Ana Beatriz Moraes', maxLength: 150 })
  @IsOptional()
  @IsString({ message: 'Passageiro inválido' })
  @MaxLength(150, { message: 'Passageiro deve ter no máximo 150 caracteres' })
  passageiro?: string;

  @ApiPropertyOptional({ example: 'econômica', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Classe inválida' })
  @MaxLength(50, { message: 'Classe deve ter no máximo 50 caracteres' })
  classe?: string;

  @ApiPropertyOptional({ example: 'Terminal 2', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'Terminal inválido' })
  @MaxLength(100, { message: 'Terminal deve ter no máximo 100 caracteres' })
  terminal?: string;

  @ApiPropertyOptional({ example: '12A', maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'Assento inválido' })
  @MaxLength(20, { message: 'Assento deve ter no máximo 20 caracteres' })
  assento?: string;

  @ApiPropertyOptional({ enum: ['BRL', 'USD', 'EUR'], example: 'BRL' })
  @IsOptional()
  @IsIn(['BRL', 'USD', 'EUR'], { message: 'Moeda deve ser BRL, USD ou EUR' })
  moeda?: string;

  @ApiPropertyOptional({ example: 780, minimum: 0, description: 'Valor em reais.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number;

  @ApiPropertyOptional({ example: '9f2c8a7b4e1d', maxLength: 128, description: 'Hash do documento importado (nunca o documento em si).' })
  @IsOptional()
  @IsString({ message: 'Hash do documento inválido' })
  @MaxLength(128, { message: 'Hash do documento deve ter no máximo 128 caracteres' })
  documentoHash?: string;

  @ApiPropertyOptional({ enum: ['pdf', 'imagem', 'manual'], example: 'manual' })
  @IsOptional()
  @IsIn(['pdf', 'imagem', 'manual'], { message: 'Origem da importação inválida' })
  importadoDe?: 'pdf' | 'imagem' | 'manual';
}

export class AtualizarPassagemDto extends CriarPassagemDto {}
