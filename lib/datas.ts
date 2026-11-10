/**
 * "Hoje" no calendário do computador que roda o sistema (em Belém, UTC−3),
 * expresso como meia-noite UTC — a mesma convenção das datas gravadas
 * (vencimento 10/11 → 2026-11-10T00:00Z; audiência às 10h → 10:00Z).
 *
 * Não usar getUTCDate() de `new Date()` para saber o dia de hoje: das 21h à
 * meia-noite de Belém o relógio UTC já está no dia seguinte, e um prazo de
 * amanhã apareceria como "vence hoje".
 */
export function hojeUtc(referencia: Date = new Date()): number {
  return Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
}

/** Dia (meia-noite UTC) de uma data gravada no banco. */
export function diaGravadoUtc(data: Date): number {
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Dias de `referencia` (hoje local) até a data gravada; negativo se já passou. */
export function diasAte(data: Date, referencia: Date = new Date()): number {
  return Math.round((diaGravadoUtc(data) - hojeUtc(referencia)) / UM_DIA_MS);
}

/** Hoje (calendário local) como Date à meia-noite UTC — para comparar com datas gravadas. */
export function hojeComoData(referencia: Date = new Date()): Date {
  return new Date(hojeUtc(referencia));
}

/** "AAAA-MM-DD" de hoje no calendário local (valor padrão de campos de data). */
export function hojeIsoLocal(referencia: Date = new Date()): string {
  return hojeComoData(referencia).toISOString().slice(0, 10);
}
