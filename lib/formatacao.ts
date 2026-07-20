export const LABEL_TIPO_CLIENTE: Record<string, string> = {
  PF: "Pessoa Física",
  PJ: "Pessoa Jurídica",
};

export const LABEL_AREA: Record<string, string> = {
  CIVEL: "Cível",
  TRABALHISTA: "Trabalhista",
  PREVIDENCIARIO: "Previdenciário",
  TRIBUTARIO: "Tributário",
  PENAL: "Penal",
  EMPRESARIAL: "Empresarial/Societário",
  FAMILIA_SUCESSOES: "Família e Sucessões",
  CONSUMIDOR: "Consumidor",
  ADMINISTRATIVO: "Administrativo",
  ELEITORAL: "Eleitoral",
  AMBIENTAL: "Ambiental",
  IMOBILIARIO: "Imobiliário",
  OUTRO: "Outro",
};

/** Ordem de exibição das áreas nos selects (Outro sempre por último). */
export const AREAS_PROCESSO = [
  "CIVEL",
  "TRABALHISTA",
  "PREVIDENCIARIO",
  "TRIBUTARIO",
  "PENAL",
  "EMPRESARIAL",
  "FAMILIA_SUCESSOES",
  "CONSUMIDOR",
  "ADMINISTRATIVO",
  "ELEITORAL",
  "AMBIENTAL",
  "IMOBILIARIO",
  "OUTRO",
] as const;

/** Rótulo de exibição da área — para "Outro" mostra o texto informado, se houver. */
export function formatarArea(area: string, areaOutraDescricao: string | null): string {
  if (area === "OUTRO" && areaOutraDescricao) {
    return areaOutraDescricao;
  }
  return LABEL_AREA[area] ?? area;
}

export const LABEL_JURISDICAO: Record<string, string> = {
  JUIZADO_ESPECIAL: "Juizado Especial",
  JUSTICA_COMUM: "Justiça Comum",
};

export const LABEL_RITO: Record<string, string> = {
  SUMARIO: "Sumário",
  SUMARISSIMO: "Sumaríssimo",
  ORDINARIO: "Ordinário",
};

/** Ritos válidos por jurisdição — o rito sumaríssimo é do juizado; sumário e ordinário, da justiça comum. */
export const RITOS_POR_JURISDICAO: Record<string, string[]> = {
  JUIZADO_ESPECIAL: ["SUMARISSIMO"],
  JUSTICA_COMUM: ["SUMARIO", "ORDINARIO"],
};

export const LABEL_MODALIDADE_AUDIENCIA: Record<string, string> = {
  VIRTUAL: "Virtual",
  HIBRIDA: "Híbrida",
  PRESENCIAL: "Presencial",
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

export function formatarHorario(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataHorario(data: Date | string): string {
  return `${formatarData(data)} às ${formatarHorario(data)}`;
}

export function formatarVaraComarca(
  vara: string | null,
  comarca: string | null
): string {
  if (vara && comarca) return `${vara} — ${comarca}`;
  if (vara) return vara;
  if (comarca) return comarca;
  return "Vara/comarca não informada";
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
