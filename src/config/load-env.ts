import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Resolução de ambiente e carregamento de arquivos `.env`.
 *
 * Regras (documentadas no README):
 * - `production` **não carrega arquivo nenhum**: as variáveis vêm do host
 *   (Vercel/Neon). Isso evita que um `.env` esquecido no deploy sobrescreva a
 *   conexão de produção.
 * - Em desenvolvimento/teste a precedência é do mais específico para o mais
 *   geral: `.env.local` → `.env.<ambiente>` → `.env`.
 * - `process.loadEnvFile` nunca sobrescreve variável já definida, então o
 *   primeiro arquivo carregado vence — daí a ordem acima.
 * - `ENV_FILE` força um único arquivo (útil em CI), inclusive em produção.
 */

/** Ambiente efetivo, normalizando `prod` → `production` e vazio → `development`. */
export function ambienteAtual(valor: string | undefined = process.env.NODE_ENV): string {
  const ambiente = (valor ?? '').trim().toLowerCase();
  if (ambiente === 'prod') {
    return 'production';
  }
  return ambiente.length > 0 ? ambiente : 'development';
}

/** Arquivos candidatos, na ordem de precedência (o primeiro que existir vence). */
export function arquivosDeEnv(
  ambiente: string = ambienteAtual(),
  cwd: string = process.cwd(),
): string[] {
  const explicito = process.env.ENV_FILE?.trim();
  if (explicito) {
    return [resolve(cwd, explicito)];
  }
  if (ambiente === 'production') {
    return [];
  }
  return ['.env.local', `.env.${ambiente}`, '.env'].map((arquivo) => resolve(cwd, arquivo));
}

export interface ResultadoCarregamentoEnv {
  /** Ambiente efetivo usado na resolução. */
  readonly ambiente: string;
  /** Arquivos efetivamente carregados, na ordem. */
  readonly carregados: string[];
  /** Arquivos ausentes (não é erro — `.env` é opcional). */
  readonly ausentes: string[];
}

/**
 * Carrega os arquivos de ambiente aplicáveis no `process.env`.
 *
 * Chamado no bootstrap da API (antes do Nest) e pelo CLI do Prisma/seed, para
 * que aplicação e ferramentas enxerguem exatamente o mesmo banco.
 */
export function carregarEnv(
  ambiente: string = ambienteAtual(),
  cwd: string = process.cwd(),
): ResultadoCarregamentoEnv {
  const carregados: string[] = [];
  const ausentes: string[] = [];
  const visitados = new Set<string>();

  for (const caminho of arquivosDeEnv(ambiente, cwd)) {
    if (visitados.has(caminho)) {
      continue;
    }
    visitados.add(caminho);

    if (!existsSync(caminho)) {
      ausentes.push(caminho);
      continue;
    }

    process.loadEnvFile(caminho);
    carregados.push(caminho);
  }

  return { ambiente, carregados, ausentes };
}
