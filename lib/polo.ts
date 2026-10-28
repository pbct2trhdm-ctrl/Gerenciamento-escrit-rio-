import type { PoloProcessual } from "@/app/generated/prisma/client";

/**
 * Lado das partes nas publicações: descobre o polo do cliente pelo texto
 * ("AUTOR: FULANO", "FULANO (A)") e classifica a quem se dirige a frase que
 * abre um prazo ("intime-se a parte ré para…"). Trabalha sobre texto já
 * normalizado (minúsculas, sem acentos — ver normalizarTexto).
 */

const TERMOS_ATIVO =
  "autor|autora|autores|autoras|requerente|requerentes|exequente|exequentes|reclamante|reclamantes|embargante|embargantes|impetrante|impetrantes|demandante|demandantes|promovente|promoventes|polo ativo|parte ativa";
const TERMOS_PASSIVO =
  "reu|reus|parte re|a re|requerido|requerida|requeridos|requeridas|executado|executada|executados|executadas|reclamado|reclamada|reclamados|reclamadas|embargado|embargada|embargados|embargadas|impetrado|impetrada|demandado|demandada|demandados|demandadas|promovido|promovida|polo passivo|parte passiva";

const REGEX_ATIVO = new RegExp(`\\b(?:${TERMOS_ATIVO})\\b`);
const REGEX_PASSIVO = new RegExp(`\\b(?:${TERMOS_PASSIVO})\\b`);
const REGEX_AMBAS = /\b(?:as partes|ambas as partes|partes litigantes|os litigantes|todas as partes)\b/;

function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Variações do nome do cliente para procurar no texto: completo e "primeiro + último". */
function variacoesNome(nomeCliente: string): string[] {
  const completo = normalizarNome(nomeCliente);
  const partes = completo.split(" ").filter(Boolean);
  const variacoes = [completo];
  if (partes.length >= 3) variacoes.push(`${partes[0]} ${partes[partes.length - 1]}`);
  return variacoes.filter((v) => v.length >= 5);
}

export function textoMencionaCliente(texto: string, nomeCliente: string): boolean {
  return variacoesNome(nomeCliente).some((v) => texto.includes(v));
}

/**
 * Polo do cliente a partir do texto da publicação: "NOME (A)" / "NOME (P)"
 * (cabeçalho do DJEN) ou "AUTOR: NOME" / "RÉU: NOME" e equivalentes.
 */
export function inferirPoloCliente(texto: string, nomeCliente: string): PoloProcessual | null {
  const encontrados = new Set<PoloProcessual>();
  for (const nome of variacoesNome(nomeCliente)) {
    let inicio = texto.indexOf(nome);
    while (inicio !== -1) {
      const depois = texto.slice(inicio + nome.length, inicio + nome.length + 6);
      if (/^\s*\(a\)/.test(depois)) encontrados.add("ATIVO");
      if (/^\s*\(p\)/.test(depois)) encontrados.add("PASSIVO");
      const antes = texto.slice(Math.max(0, inicio - 40), inicio);
      const rotulo = /([a-z ]+?)s?\s*:\s*$/.exec(antes)?.[1]?.trim() ?? "";
      if (new RegExp(`(?:^|\\s)(?:${TERMOS_ATIVO})$`).test(rotulo)) encontrados.add("ATIVO");
      if (new RegExp(`(?:^|\\s)(?:${TERMOS_PASSIVO})$`).test(rotulo)) encontrados.add("PASSIVO");
      inicio = texto.indexOf(nome, inicio + nome.length);
    }
  }
  return encontrados.size === 1 ? [...encontrados][0] : null;
}

export type DestinatarioPrazo = "cliente" | "contraria" | "ambas" | "indefinido";

/**
 * A quem se dirige a frase do prazo. O primeiro termo de polo da frase
 * costuma ser o destinatário ("Intime-se a parte autora para, querendo,
 * manifestar-se sobre a contestação da ré…" → autora).
 */
export function classificarDestinatario(
  frase: string,
  nomeCliente: string,
  poloCliente: PoloProcessual | null
): DestinatarioPrazo {
  if (textoMencionaCliente(frase, nomeCliente)) return "cliente";
  if (REGEX_AMBAS.test(frase)) return "ambas";

  const ativo = REGEX_ATIVO.exec(frase);
  const passivo = REGEX_PASSIVO.exec(frase);
  if (!ativo && !passivo) return "indefinido";
  const primeiro: PoloProcessual =
    ativo && (!passivo || ativo.index < passivo.index) ? "ATIVO" : "PASSIVO";
  if (!poloCliente) return "indefinido";
  return primeiro === poloCliente ? "cliente" : "contraria";
}

/** Frase (aprox.) que contém a posição: do último ". " / "; " anterior até a posição final. */
export function fraseAoRedor(texto: string, inicio: number, fim: number): string {
  const antes = texto.slice(Math.max(0, inicio - 300), inicio);
  const corte = Math.max(antes.lastIndexOf(". "), antes.lastIndexOf("; "));
  return (corte === -1 ? antes : antes.slice(corte + 2)) + texto.slice(inicio, fim);
}
