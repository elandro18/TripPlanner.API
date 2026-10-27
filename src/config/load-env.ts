import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carrega o arquivo `.env` (se existir) para `process.env`.
 *
 * Usa o `process.loadEnvFile` nativo do Node (>= 20.12) — evita dependência
 * externa e mantém os segredos fora do repositório (SECURITY.md §3).
 * Variáveis já definidas no ambiente têm precedência.
 */
export function carregarEnv(arquivo = '.env', cwd = process.cwd()): void {
  const caminho = resolve(cwd, arquivo);
  if (!existsSync(caminho)) {
    return;
  }
  process.loadEnvFile(caminho);
}
