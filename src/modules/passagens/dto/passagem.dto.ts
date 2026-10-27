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
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn([...TIPOS_PASSAGEM], { message: 'Tipo de passagem inválido (use AVIAO, TREM ou ONIBUS)' })
  tipo: string;

  @IsNotEmpty({ message: 'Campo obrigatório: origem' })
  @IsString({ message: 'Origem inválida' })
  @MaxLength(150, { message: 'Origem deve ter no máximo 150 caracteres' })
  origem: string;

  @IsNotEmpty({ message: 'Destino é obrigatório' })
  @IsString({ message: 'Destino é obrigatório' })
  @MaxLength(150, { message: 'Destino deve ter no máximo 150 caracteres' })
  destino: string;

  @IsNotEmpty({ message: 'Campo obrigatório: dataHoraPartida' })
  @IsDateString({}, { message: 'Data/hora de partida inválida' })
  dataHoraPartida: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data/hora de chegada inválida' })
  dataHoraChegada?: string;

  @IsOptional()
  @IsString({ message: 'Companhia inválida' })
  @MaxLength(100, { message: 'Companhia deve ter no máximo 100 caracteres' })
  companhia?: string;

  @IsOptional()
  @IsString({ message: 'Localizador inválido' })
  @MaxLength(50, { message: 'Localizador deve ter no máximo 50 caracteres' })
  localizador?: string;

  @IsOptional()
  @IsString({ message: 'Número do bilhete inválido' })
  @MaxLength(50, { message: 'Número do bilhete deve ter no máximo 50 caracteres' })
  numeroBilhete?: string;

  @IsOptional()
  @IsString({ message: 'Passageiro inválido' })
  @MaxLength(150, { message: 'Passageiro deve ter no máximo 150 caracteres' })
  passageiro?: string;

  @IsOptional()
  @IsString({ message: 'Classe inválida' })
  @MaxLength(50, { message: 'Classe deve ter no máximo 50 caracteres' })
  classe?: string;

  @IsOptional()
  @IsString({ message: 'Terminal inválido' })
  @MaxLength(100, { message: 'Terminal deve ter no máximo 100 caracteres' })
  terminal?: string;

  @IsOptional()
  @IsString({ message: 'Assento inválido' })
  @MaxLength(20, { message: 'Assento deve ter no máximo 20 caracteres' })
  assento?: string;

  @IsOptional()
  @IsIn(['BRL', 'USD', 'EUR'], { message: 'Moeda deve ser BRL, USD ou EUR' })
  moeda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valor?: number;

  @IsOptional()
  @IsString({ message: 'Hash do documento inválido' })
  @MaxLength(128, { message: 'Hash do documento deve ter no máximo 128 caracteres' })
  documentoHash?: string;

  @IsOptional()
  @IsIn(['pdf', 'imagem', 'manual'], { message: 'Origem da importação inválida' })
  importadoDe?: 'pdf' | 'imagem' | 'manual';
}

export class AtualizarPassagemDto extends CriarPassagemDto {}
