export const DIAS_ALERTA_ALVARA = 7;

export type StatusParcelaEfetivo = "PENDENTE" | "PAGO" | "ATRASADO";

/**
 * A Parcela só guarda PENDENTE/PAGO no banco; ATRASADO é derivado em
 * tempo de leitura comparando o vencimento com a data atual, sem
 * depender de um job para "virar" o status.
 */
export function statusEfetivoParcela(
  parcela: { status: string; vencimento: Date },
  referencia: Date = new Date()
): StatusParcelaEfetivo {
  if (parcela.status === "PAGO") return "PAGO";
  const hoje = Date.UTC(
    referencia.getUTCFullYear(),
    referencia.getUTCMonth(),
    referencia.getUTCDate()
  );
  const vencimento = Date.UTC(
    parcela.vencimento.getUTCFullYear(),
    parcela.vencimento.getUTCMonth(),
    parcela.vencimento.getUTCDate()
  );
  return vencimento < hoje ? "ATRASADO" : "PENDENTE";
}

export function primeiroDiaMes(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

export function competenciaDeString(valor: string): Date {
  const [ano, mes] = valor.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, 1));
}

export function competenciaParaString(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function mesAdjacente(data: Date, deslocamento: number): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + deslocamento, 1));
}

export function dentroDoMes(data: Date, competencia: Date): boolean {
  return (
    data.getUTCFullYear() === competencia.getUTCFullYear() &&
    data.getUTCMonth() === competencia.getUTCMonth()
  );
}

export function diasDesde(data: Date, referencia: Date = new Date()): number {
  const hoje = Date.UTC(
    referencia.getUTCFullYear(),
    referencia.getUTCMonth(),
    referencia.getUTCDate()
  );
  const inicio = Date.UTC(
    data.getUTCFullYear(),
    data.getUTCMonth(),
    data.getUTCDate()
  );
  return Math.round((hoje - inicio) / (1000 * 60 * 60 * 24));
}

export function sugerirInss(valorProLabore: number): number {
  return Math.round(valorProLabore * 0.11 * 100) / 100;
}

export function sugerirCpp(valorProLabore: number): number {
  return Math.round(valorProLabore * 0.2 * 100) / 100;
}
