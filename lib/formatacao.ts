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

export const LABEL_TIPO_HONORARIO: Record<string, string> = {
  FIXO: "Fixo",
  PARCELADO: "Parcelado",
  EXITO: "Êxito",
  MENSALIDADE: "Mensalidade",
};

export const LABEL_STATUS_PARCELA: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
};

export const LABEL_STATUS_SUCUMBENCIA: Record<string, string> = {
  AGUARDANDO_DECISAO: "Aguardando decisão",
  DEFINIDO: "Definido",
  EM_EXECUCAO: "Em execução",
  RECEBIDO: "Recebido",
};

export const LABEL_FORMA_RECEBIMENTO: Record<string, string> = {
  RPV: "RPV",
  PRECATORIO: "Precatório",
  DEPOSITO_DIRETO: "Depósito direto",
  OUTRO: "Outro",
};

export const LABEL_STATUS_ALVARA: Record<string, string> = {
  AGUARDANDO_REPASSE: "Aguardando repasse",
  REPASSADO: "Repassado",
};

export const LABEL_CATEGORIA_DESPESA: Record<string, string> = {
  CUSTAS: "Custas",
  ALUGUEL: "Aluguel",
  MATERIAL: "Material",
  OUTRO: "Outro",
};

export const LABEL_TIPO_OBRIGACAO: Record<string, string> = {
  PRO_LABORE: "Pró-labore",
  DAS: "DAS",
  INSS_SOCIO: "INSS sócio (11%)",
  CPP_PATRONAL: "CPP patronal (20%)",
};

export const LABEL_STATUS_OBRIGACAO: Record<string, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
};

export function formatarData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarCompetencia(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}
