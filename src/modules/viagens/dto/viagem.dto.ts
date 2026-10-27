import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MOEDAS, Moeda } from '../viagem.model';

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Criação/atualização de viagem (`specs/API_CONTRACTS.md` §2.2, §2.4).
 *
 * `comDatas = false` permite viagem sem período; nesse caso os dias são
 * criados manualmente. Quando `comDatas` não é informado, a presença das datas
 * define o comportamento.
 */
export class CriarViagemDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsNotEmpty({ message: 'Destino é obrigatório' })
  @IsString({ message: 'Destino é obrigatório' })
  @MaxLength(150, { message: 'Destino deve ter no máximo 150 caracteres' })
  destino: string;

  /** `false` libera a viagem sem datas (dias manuais). */
  @IsOptional()
  @IsBoolean({ message: 'comDatas deve ser booleano' })
  comDatas?: boolean;

  @ValidateIf((dto: CriarViagemDto) => dto.comDatas !== false)
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @Matches(FORMATO_DATA, { message: 'Data de início deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de início inválida' })
  dataInicio?: string;

  @ValidateIf((dto: CriarViagemDto) => dto.comDatas !== false)
  @IsNotEmpty({ message: 'Data de fim é obrigatória' })
  @Matches(FORMATO_DATA, { message: 'Data de fim deve estar no formato AAAA-MM-DD' })
  @IsDateString({}, { message: 'Data de fim inválida' })
  dataFim?: string;

  @IsOptional()
  @IsIn([...MOEDAS], { message: 'Moeda deve ser BRL, USD ou EUR' })
  moeda?: Moeda;

  /** URL da imagem de capa (http/https). */
  @IsOptional()
  @IsString({ message: 'Capa inválida' })
  @MaxLength(500, { message: 'Capa deve ter no máximo 500 caracteres' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Capa deve ser uma URL http(s) válida' },
  )
  capaUrl?: string;
}

export class AtualizarViagemDto extends CriarViagemDto {}
