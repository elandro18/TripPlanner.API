import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const URL_HTTP = { protocols: ['http', 'https'], require_protocol: true };

/**
 * Cadastro/edição de hotel (`specs/API_CONTRACTS.md` §6.2; UI_SPEC §7.3).
 *
 * `valorTotal` é opcional e, quando omitido, é calculado como
 * `valorNoite × noites` (RN-017). Sem valores, a hospedagem é registrada
 * apenas com período e endereço.
 */
export class CriarHotelDto {
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

  @IsNotEmpty({ message: 'Campo obrigatório: dataHoraCheckin' })
  @IsDateString({}, { message: 'Data/hora de check-in inválida' })
  dataHoraCheckin: string;

  @IsNotEmpty({ message: 'Campo obrigatório: dataHoraCheckout' })
  @IsDateString({}, { message: 'Data/hora de check-out inválida' })
  dataHoraCheckout: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor da noite deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valorNoite?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número de noites deve ser um inteiro' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  noites?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor total deve ser um valor numérico' })
  @Min(0, { message: 'Valor não pode ser negativo' })
  valorTotal?: number;

  @IsOptional()
  @IsString({ message: 'Reserva inválida' })
  @MaxLength(50, { message: 'Reserva deve ter no máximo 50 caracteres' })
  reserva?: string;

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

export class AtualizarHotelDto extends CriarHotelDto {}
