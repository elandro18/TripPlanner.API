/**
 * Conversão entre reais (domínio/API) e centavos (SQLite/Prisma).
 *
 * Valores monetários são persistidos como inteiros em centavos para evitar
 * erros de arredondamento de ponto flutuante.
 */

export function paraCentavos(reais: number | null | undefined): number | null {
  if (reais === null || reais === undefined || Number.isNaN(reais)) {
    return null;
  }
  return Math.round(reais * 100);
}

export function deCentavos(centavos: number | null | undefined): number | null {
  if (centavos === null || centavos === undefined) {
    return null;
  }
  return centavos / 100;
}
