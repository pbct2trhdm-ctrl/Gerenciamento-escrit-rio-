import { LABEL_TIPO_PRAZO } from "@/lib/formatacao";

/** Observações escritas pelo sistema ao gerar o prazo — não servem de título. */
const PREFIXOS_AUTOMATICOS = ["Gerado automaticamente", "Audiência captada"];

/**
 * Título do prazo para listas: a primeira linha das observações quando foi a
 * advogada que escreveu ("Manifestação sobre a contestação"); senão o tipo.
 */
export function tituloPrazo(prazo: { tipo: string; observacoes: string | null }): {
  titulo: string;
  tipoSeparado: string | null;
} {
  const tipo = LABEL_TIPO_PRAZO[prazo.tipo] ?? prazo.tipo;
  const primeiraLinha = prazo.observacoes?.split("\n")[0].trim() ?? "";
  if (!primeiraLinha || PREFIXOS_AUTOMATICOS.some((p) => primeiraLinha.startsWith(p))) {
    return { titulo: tipo, tipoSeparado: null };
  }
  const titulo = primeiraLinha.length > 90 ? `${primeiraLinha.slice(0, 87)}…` : primeiraLinha;
  return { titulo, tipoSeparado: tipo };
}

/** Texto curto da contagem: "Vence hoje", "3 dias", "2 dias de atraso". */
export function textoDiasRestantes(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} de atraso`;
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Amanhã";
  return `${dias} dias`;
}
