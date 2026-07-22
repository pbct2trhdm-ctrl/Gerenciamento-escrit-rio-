export const classeInput =
  "w-full rounded-md border border-slate-300 bg-superficie px-3 py-2 text-sm text-slate-800 placeholder:text-texto-secundario/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

/**
 * Mesmo visual de classeInput mas sem `w-full` — usar em barras de filtro
 * (selects lado a lado com outros controles), onde `w-full` entraria em
 * conflito com `flex-1`/largura automática dos elementos vizinhos.
 */
export const classeInputAuto =
  "rounded-md border border-slate-300 bg-superficie px-3 py-2 text-sm text-slate-800 placeholder:text-texto-secundario/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

export const classeBotaoPrimario =
  "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-accent-hover transition-colors";

export const classeBotaoSecundario =
  "inline-flex items-center justify-center rounded-md border border-slate-300 bg-superficie px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors";

export const classeBotaoPerigo =
  "inline-flex items-center justify-center rounded-md border border-critico/30 bg-critico-fundo px-3 py-1.5 text-sm text-critico hover:bg-red-100 transition-colors";

export const classeBotaoConfirma =
  "inline-flex items-center justify-center rounded-md border border-tranquilo/30 bg-tranquilo-fundo px-3 py-1.5 text-sm text-tranquilo hover:bg-green-100 transition-colors";

export const classeCard =
  "rounded-xl border border-slate-200 bg-superficie p-4 shadow-xs";

export const classeCardHover =
  "rounded-xl border border-slate-200 bg-superficie p-4 shadow-xs transition-all hover:border-accent/40 hover:bg-fundo";

export const classeLabel = "block text-sm font-medium mb-1 text-texto-principal";

/**
 * Badge neutro para categorização visual (ex.: PF/PJ) — não usar para
 * status/urgência, que têm cores semânticas próprias em lib/urgencia.ts.
 */
export const classeBadgeNeutro =
  "inline-flex items-center rounded-full border border-borda-suave bg-slate-100 px-2 py-0.5 text-xs font-medium text-texto-secundario";

export const classeTituloSecao = "font-display text-lg font-medium text-texto-principal";

export const classeTituloPagina = "font-display text-2xl font-semibold text-texto-principal";
