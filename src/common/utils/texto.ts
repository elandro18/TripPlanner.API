/**
 * Texto opcional: `trim` e vazio → `null`.
 *
 * Mantém a resposta da API coerente entre o `POST`/`PUT` (que ecoam o corpo
 * enviado) e o `GET` seguinte (que lê a planilha, onde vazio é célula em branco).
 */
export function opcional(valor: string | null | undefined): string | null {
  const texto = valor?.trim();
  return texto && texto.length > 0 ? texto : null;
}
