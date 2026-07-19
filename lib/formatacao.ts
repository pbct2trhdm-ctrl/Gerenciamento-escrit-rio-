export const LABEL_TIPO_CLIENTE: Record<string, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

export const LABEL_AREA: Record<string, string> = {
  CIVEL: "Cível",
  PREVIDENCIARIO: "Previdenciário",
  TRIBUTARIO: "Tributário",
  OUTRO: "Outro",
};

export const LABEL_STATUS_PROCESSO: Record<string, string> = {
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  ARQUIVADO: "Arquivado",
  ENCERRADO: "Encerrado",
};

export const LABEL_TIPO_PRAZO: Record<string, string> = {
  PETICAO: "Petição",
  RECURSO: "Recurso",
  AUDIENCIA: "Audiência",
  MANIFESTACAO: "Manifestação",
  OUTRO: "Outro",
};

export const LABEL_CONTAGEM: Record<string, string> = {
  DIAS_UTEIS: "Dias úteis",
  DIAS_CORRIDOS: "Dias corridos",
};

export const LABEL_STATUS_PRAZO: Record<string, string> = {
  PENDENTE: "Pendente",
  CUMPRIDO: "Cumprido",
  PERDIDO: "Perdido",
};

export function formatarData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
