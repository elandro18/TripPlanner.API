/** Utilitários de data/hora compartilhados pelos serviços de domínio. */

/** Instante (ms) de uma data/hora ISO; `null` quando não interpretável. */
export function instanteDe(dataHora: string): number | null {
  const instante = Date.parse(dataHora);
  return Number.isNaN(instante) ? null : instante;
}

/** Soma (ou subtrai) dias de uma data `YYYY-MM-DD`, sem fuso horário. */
export function adicionarDias(data: string, dias: number): string {
  const instante = Date.parse(`${data}T00:00:00Z`);
  return new Date(instante + dias * 86_400_000).toISOString().slice(0, 10);
}
