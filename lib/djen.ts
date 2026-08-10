/**
 * Cliente da API pública do Diário de Justiça Eletrônico Nacional (DJEN),
 * mantida pelo CNJ em comunicaapi.pje.jus.br — consulta gratuita, sem
 * autenticação, por número de OAB e seccional.
 *
 * IMPORTANTE: este cliente foi implementado com base na documentação
 * pública e em relatos de terceiros sobre o formato da API (o ambiente de
 * desenvolvimento usado para construí-lo não tem acesso de rede a
 * comunicaapi.pje.jus.br para testar contra a API real). Os nomes de campos
 * abaixo — em especial os de PublicacaoDjenBruta — são a melhor
 * aproximação disponível, com leitura defensiva de variações de nome mais
 * prováveis. Teste contra o número de OAB real antes de confiar na rotina
 * automática; se os campos vierem diferentes, ajuste `normalizarItem`.
 */

const BASE_URL = "https://comunicaapi.pje.jus.br/api/v1/comunicacao";

export type PublicacaoDjenNormalizada = {
  idExterno: string;
  numeroProcesso: string | null;
  dataPublicacao: Date;
  tribunalOrgao: string;
  texto: string;
};

/** Formato de retorno documentado varia por campo — leitura defensiva de cada valor. */
type PublicacaoDjenBruta = Record<string, unknown>;

function textoDe(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

function primeiroTexto(item: PublicacaoDjenBruta, chaves: string[]): string {
  for (const chave of chaves) {
    const valor = item[chave];
    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      return textoDe(valor);
    }
  }
  return "";
}

function parseDataPublicacao(valor: string): Date {
  // Formatos observados/esperados: "2026-08-10" ou "2026-08-10T00:00:00".
  const data = new Date(valor.length <= 10 ? `${valor}T00:00:00` : valor);
  return Number.isNaN(data.getTime()) ? new Date() : data;
}

function normalizarItem(item: PublicacaoDjenBruta): PublicacaoDjenNormalizada | null {
  const idExterno = primeiroTexto(item, ["id", "numeroComunicacao", "hash"]);
  if (!idExterno) return null;

  const dataTexto = primeiroTexto(item, ["data_disponibilizacao", "dataDisponibilizacao"]);
  const tribunalOrgao =
    primeiroTexto(item, ["nomeOrgao", "orgao", "nome_orgao"]) ||
    primeiroTexto(item, ["siglaTribunal", "sigla_tribunal"]) ||
    "Órgão não informado";
  const texto = primeiroTexto(item, ["texto", "conteudo"]);
  const numeroProcesso = primeiroTexto(item, ["numero_processo", "numeroProcesso"]) || null;

  return {
    idExterno,
    numeroProcesso,
    dataPublicacao: dataTexto ? parseDataPublicacao(dataTexto) : new Date(),
    tribunalOrgao,
    texto,
  };
}

function paraDataISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/**
 * Busca publicações no DJEN para a OAB/seccional informadas, no intervalo de
 * datas dado (inclusive). Percorre a paginação da API até esgotar os
 * resultados. Lança erro em caso de falha de rede/HTTP — quem chamar deve
 * tratar (a rotina diária captura e registra o erro sem quebrar o app).
 */
export async function buscarPublicacoesDjen(
  numeroOab: string,
  seccionalOab: string,
  dataInicio: Date,
  dataFim: Date
): Promise<PublicacaoDjenNormalizada[]> {
  const itensPorPagina = 100;
  const resultado: PublicacaoDjenNormalizada[] = [];
  let pagina = 1;

  while (true) {
    const params = new URLSearchParams({
      numeroOab,
      ufOab: seccionalOab,
      dataDisponibilizacaoInicio: paraDataISO(dataInicio),
      dataDisponibilizacaoFim: paraDataISO(dataFim),
      pagina: String(pagina),
      itensPorPagina: String(itensPorPagina),
    });

    const resposta = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      throw new Error(`API do DJEN retornou ${resposta.status}: ${corpo.slice(0, 300)}`);
    }

    const corpo = (await resposta.json()) as { items?: unknown; count?: unknown };
    const itens = Array.isArray(corpo.items) ? corpo.items : [];

    for (const item of itens) {
      if (item && typeof item === "object") {
        const normalizado = normalizarItem(item as PublicacaoDjenBruta);
        if (normalizado) resultado.push(normalizado);
      }
    }

    if (itens.length < itensPorPagina) break;
    pagina += 1;
    if (pagina > 50) break; // trava de segurança contra paginação infinita
  }

  return resultado;
}

/**
 * Extrai um número de processo em formato CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO) do
 * texto da publicação, quando presente.
 */
export function extrairNumeroProcesso(texto: string): string | null {
  const match = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
  return match ? match[0] : null;
}
