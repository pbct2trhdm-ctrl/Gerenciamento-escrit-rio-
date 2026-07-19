import { statusEfetivoParcela } from "@/lib/financeiro";

/**
 * As três faixas de urgência do design system. Fixas por regra objetiva
 * (dias restantes / status), nunca escolhidas visualmente caso a caso.
 * "neutro" é usado para estados que não representam urgência (ex.:
 * processo arquivado, sucumbência aguardando decisão).
 */
export type Tier = "critico" | "atencao" | "tranquilo" | "neutro";

export const TIER_LABEL: Record<Tier, string> = {
  critico: "Urgente",
  atencao: "Atenção",
  tranquilo: "Em dia",
  neutro: "—",
};

export const TIER_COR: Record<Tier, string> = {
  critico: "#B33A3A",
  atencao: "#C9A227",
  tranquilo: "#3F7550",
  neutro: "#6B7280",
};

/** classes utilitárias para badges/selos — bg suave + texto/borda na cor cheia do tier */
export const TIER_CLASSES: Record<Tier, string> = {
  critico: "bg-critico/10 text-critico border-critico/30",
  atencao: "bg-atencao/10 text-atencao border-atencao/40",
  tranquilo: "bg-tranquilo/10 text-tranquilo border-tranquilo/30",
  neutro: "bg-gray-100 text-texto-secundario border-gray-200",
};

/**
 * Faixas fixas de dias restantes para prazos: ≤3 crítico, 4–7 atenção,
 * 8+ tranquilo. Vale também para dias em atraso (negativos ⇒ crítico).
 */
export function tierPorDiasRestantes(diasRestantes: number): Tier {
  if (diasRestantes <= 3) return "critico";
  if (diasRestantes <= 7) return "atencao";
  return "tranquilo";
}

export function tierPrazo(status: string, diasRestantes: number): Tier {
  if (status === "CUMPRIDO") return "tranquilo";
  if (status === "PERDIDO") return "critico";
  return tierPorDiasRestantes(diasRestantes);
}

const STATUS_TIER: Record<string, Tier> = {
  PAGO: "tranquilo",
  ATRASADO: "critico",
  REPASSADO: "tranquilo",
  RECEBIDO: "tranquilo",
  DEFINIDO: "atencao",
  EM_EXECUCAO: "atencao",
  AGUARDANDO_DECISAO: "neutro",
  AGUARDANDO_REPASSE: "atencao",
  ATIVO: "neutro",
  SUSPENSO: "atencao",
  ARQUIVADO: "neutro",
  ENCERRADO: "neutro",
};

/** Mapeamento fixo de status → faixa, usado por padrão em badges de status. */
export function tierStatus(status: string): Tier {
  return STATUS_TIER[status] ?? "neutro";
}

export function tierParcela(
  parcela: { status: string; vencimento: Date },
  referencia: Date = new Date()
): Tier {
  const efetivo = statusEfetivoParcela(parcela, referencia);
  if (efetivo === "ATRASADO") return "critico";
  if (efetivo === "PAGO") return "tranquilo";
  const diasParaVencer = Math.round(
    (Date.UTC(
      parcela.vencimento.getUTCFullYear(),
      parcela.vencimento.getUTCMonth(),
      parcela.vencimento.getUTCDate()
    ) -
      Date.UTC(
        referencia.getUTCFullYear(),
        referencia.getUTCMonth(),
        referencia.getUTCDate()
      )) /
      (1000 * 60 * 60 * 24)
  );
  return diasParaVencer <= 7 ? "atencao" : "tranquilo";
}

export function tierAlvara(
  alvara: { status: string; dataRecebimento: Date | null },
  diasAlerta: number,
  referencia: Date = new Date()
): Tier {
  if (alvara.status === "REPASSADO") return "tranquilo";
  if (!alvara.dataRecebimento) return "neutro";
  const dias = Math.round(
    (Date.UTC(
      referencia.getUTCFullYear(),
      referencia.getUTCMonth(),
      referencia.getUTCDate()
    ) -
      Date.UTC(
        alvara.dataRecebimento.getUTCFullYear(),
        alvara.dataRecebimento.getUTCMonth(),
        alvara.dataRecebimento.getUTCDate()
      )) /
      (1000 * 60 * 60 * 24)
  );
  return dias > diasAlerta ? "critico" : "atencao";
}
