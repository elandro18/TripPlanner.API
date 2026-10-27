import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_HTTP = { protocols: ['http', 'https'], require_protocol: true };

/**
 * Cadastro/edição de local (`specs/API_CONTRACTS.md` §4.2; UI_SPEC §7.1).
 *
 * `custo` é opcional e admite zero para locais gratuitos (RN-012).
 */
export class CriarLocalDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome é obrigatório' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Endereço inválido' })
  @MaxLength(200, { message: 'Endereço deve ter no máximo 200 caracteres' })
  endereco?: string;

  @IsOptional()
  @IsString({ message: 'Cidade inválida' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  cidade?: string;

  @IsOptional()
  @IsString({ message: 'Categoria inválida' })
  @MaxLength(30, { message: 'Categoria deve ter no máximo 30 caracteres' })
  categoria?: string;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário previsto deve estar no formato HH:MM' })
  horarioPrevisto?: string;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fim deve estar no formato HH:MM' })
  horarioFim?: string;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de abertura deve estar no formato HH:MM' })
  horarioAbertura?: string;

  @IsOptional()
  @Matches(FORMATO_HORARIO, { message: 'Horário de fechamento deve estar no formato HH:MM' })
  horarioFechamento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Duração estimada deve ser um número inteiro de minutos' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  duracaoEstimada?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Custo deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  custo?: number;

  @IsOptional()
  @IsString({ message: 'Observações inválidas' })
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  observacoes?: string;

  @IsOptional()
  @IsString({ message: 'Foto inválida' })
  @MaxLength(500)
  @IsUrl(URL_HTTP, { message: 'Foto deve ser uma URL http(s) válida' })
  fotoUrl?: string;

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

  @IsOptional()
  @IsIn(['confirmado', 'aproximado', 'manual'], {
    message: 'geoStatus deve ser confirmado, aproximado ou manual',
  })
  geoStatus?: string;
}

export class AtualizarLocalDto extends CriarLocalDto {}
