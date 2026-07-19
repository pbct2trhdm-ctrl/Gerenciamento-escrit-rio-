export const classeInput =
  "w-full rounded-md border border-gray-300 bg-superficie px-3 py-2 text-sm text-texto-principal placeholder:text-texto-secundario/60";

/**
 * Mesmo visual de classeInput mas sem `w-full` — usar em barras de filtro
 * (selects lado a lado com outros controles), onde `w-full` entraria em
 * conflito com `flex-1`/largura automática dos elementos vizinhos.
 */
export const classeInputAuto =
  "rounded-md border border-gray-300 bg-superficie px-3 py-2 text-sm text-texto-principal placeholder:text-texto-secundario/60";

export const classeBotaoPrimario =
  "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-base-escura hover:brightness-95 transition-[filter]";

export const classeBotaoSecundario =
  "inline-flex items-center justify-center rounded-md border border-gray-300 bg-superficie px-3 py-1.5 text-sm text-texto-principal hover:bg-fundo transition-colors";

export const classeBotaoPerigo =
  "inline-flex items-center justify-center rounded-md border border-critico/30 bg-superficie px-3 py-1.5 text-sm text-critico hover:bg-critico/5 transition-colors";

export const classeBotaoConfirma =
  "inline-flex items-center justify-center rounded-md border border-tranquilo/30 bg-superficie px-3 py-1.5 text-sm text-tranquilo hover:bg-tranquilo/5 transition-colors";

export const classeCard =
  "rounded-lg border border-gray-200 bg-superficie p-4";

export const classeCardHover =
  "rounded-lg border border-gray-200 bg-superficie p-4 transition-colors hover:bg-fundo";

export const classeLabel = "block text-sm font-medium mb-1 text-texto-principal";

export const classeTituloSecao = "font-display text-lg font-medium text-texto-principal";

export const classeTituloPagina = "font-display text-2xl font-semibold text-texto-principal";
