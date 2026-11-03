/**
 * Validação e descrição da conexão com o PostgreSQL.
 *
 * O projeto usa **dois bancos diferentes**: PostgreSQL local em
 * desenvolvimento e Neon em produção. Apontar um para o outro é o acidente mais
 * caro possível (testar em produção ou subir produção sem banco), então a
 * `DATABASE_URL` é validada no boot com regras explícitas:
 *
 * - `NODE_ENV=production` → recusa host local/privado.
 * - `NODE_ENV` de desenvolvimento → recusa host remoto (Neon etc.), salvo
 *   `ALLOW_REMOTE_DB=true` (para quem quiser testar o Neon de propósito).
 *
 * Módulo sem dependência de framework: é usado pela API, pelo CLI do Prisma e
 * pelo seed.
 */

export interface BancoConfig {
  /** Connection string completa (com senha — nunca logar diretamente). */
  readonly url: string;
  readonly host: string;
  readonly porta: string;
  readonly database: string;
  /** Host local (`localhost`, loopback ou IP privado). */
  readonly local: boolean;
  /** Host do Neon (`*.neon.tech`). */
  readonly neon: boolean;
  /** `false` apenas quando a URL traz `sslmode=disable`. */
  readonly ssl: boolean;
}

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal']);
const IP_PRIVADO = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Esconde a senha da URL antes de escrever no log. */
export function mascararUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '<DATABASE_URL inválida>';
  }
}

/** `true` quando o host é local, loopback ou de rede privada. */
export function ehHostLocal(host: string): boolean {
  const normalizado = host.trim().toLowerCase();
  return HOSTS_LOCAIS.has(normalizado) || IP_PRIVADO.test(normalizado);
}

/**
 * Valida a `DATABASE_URL` e devolve a configuração normalizada.
 *
 * @throws Error com mensagem acionável quando a URL falta, é inválida ou aponta
 *   para o banco do ambiente errado.
 */
export function validarDatabaseUrl(
  url: string | undefined,
  ambiente: string,
  env: NodeJS.ProcessEnv = process.env,
): BancoConfig {
  const valor = url?.trim() ?? '';

  if (!valor) {
    throw new Error(
      'DATABASE_URL é obrigatória.\n' +
        '  • Desenvolvimento: rode "npm run db:setup:local" (cria o PostgreSQL local e o .env).\n' +
        '  • Produção: defina DATABASE_URL (Neon) nas variáveis de ambiente do host.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(valor);
  } catch {
    throw new Error(
      `DATABASE_URL inválida: não é uma URL. Esperado algo como "postgresql://usuario:senha@host:5432/banco?sslmode=require" (recebido: "${mascararUrl(valor)}").`,
    );
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(
      `DATABASE_URL inválida: esquema "${parsed.protocol.replace(':', '')}" não é suportado. Use postgresql:// (o projeto não usa mais SQLite).`,
    );
  }

  const host = parsed.hostname.trim();
  if (!host) {
    throw new Error('DATABASE_URL inválida: host ausente.');
  }

  const database = parsed.pathname.replace(/^\/+/, '');
  if (!database) {
    throw new Error('DATABASE_URL inválida: nome do banco ausente no final da URL.');
  }

  const local = ehHostLocal(host);
  const neon = host.toLowerCase().endsWith('.neon.tech');
  const ssl = (parsed.searchParams.get('sslmode') ?? '').toLowerCase() !== 'disable';
  const producao = ambiente === 'production';

  if (producao && local) {
    throw new Error(
      `NODE_ENV=production, mas DATABASE_URL aponta para o host local "${host}".\n` +
        '  • Em produção use a connection string do Neon (host *.neon.tech).',
    );
  }

  if (!producao && !local && env.ALLOW_REMOTE_DB !== 'true') {
    const alvo = neon ? 'Neon (produção)' : `banco remoto "${host}"`;
    throw new Error(
      `DATABASE_URL aponta para o ${alvo} em ambiente "${ambiente}".\n` +
        '  • Em desenvolvimento use o PostgreSQL local (localhost:5432).\n' +
        '  • Se a intenção é conectar neste banco remoto de propósito, defina ALLOW_REMOTE_DB=true.\n' +
        '  • Se este é um ambiente de produção, defina NODE_ENV=production.',
    );
  }

  return {
    url: valor,
    host,
    porta: parsed.port || '5432',
    database,
    local,
    neon,
    ssl,
  };
}

/** Descrição curta para logs (sem senha). */
export function descricaoDoBanco(banco: BancoConfig): string {
  const tipo = banco.local ? 'local' : banco.neon ? 'Neon' : 'remoto';
  return `${banco.host}:${banco.porta}/${banco.database} (${tipo}${banco.ssl ? ', ssl' : ', sem ssl'})`;
}

/**
 * Limite de conexões do pool `pg` (`PG_POOL_MAX`).
 *
 * Em serverless (Vercel) cada instância abre o próprio pool: com muitas
 * instâncias, o limite padrão (10) esgota as conexões do Neon. Um valor baixo
 * (3–5) é o recomendado em produção.
 */
export function limiteDoPool(valor: string | undefined, padrao = 10): number {
  const bruto = valor?.trim();
  if (!bruto) {
    return padrao;
  }
  const numero = Number(bruto);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`PG_POOL_MAX deve ser um inteiro positivo (recebido: "${bruto}")`);
  }
  return numero;
}
