import { prisma } from "@/lib/prisma";
import type { PoloProcessual } from "@/app/generated/prisma/client";
import { classificarDestinatario, fraseAoRedor, inferirPoloCliente } from "@/lib/polo";
import {
  calcularDataFinal,
  ehDiaUtil,
  proximoDiaUtil,
  type TipoContagem,
} from "@/lib/prazos";

/**
 * Criação automática de prazo a partir de uma publicação do DJEN vinculada a
 * um processo. O número de dias é lido do texto ("no prazo de 15 (quinze)
 * dias"); o prazo nasce marcado "a conferir" até a advogada confirmá-lo.
 * Quando o texto não traz um número de dias claro, nenhum prazo é criado e a
 * publicação fica marcada "prazo a definir" (destaque no Dashboard).
 *
 * Contagem (Lei 11.419/2006, art. 4º, §§ 3º e 4º; CPC, arts. 219 e 224):
 * considera-se publicada no 1º dia útil seguinte à disponibilização no DJEN, e
 * o prazo começa no 1º dia útil seguinte à publicação — calcularDataFinal já
 * conta a partir do dia seguinte à data base, então a data base é a data de
 * publicação. Só feriados nacionais são considerados (não os locais nem o
 * recesso forense), por isso a conferência continua necessária.
 */

const NUMEROS_POR_EXTENSO: Record<string, number> = {
  um: 1, dois: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30,
  quarenta: 40, cinquenta: 50, sessenta: 60, noventa: 90,
};

export type PrazoIdentificado = { dias: number; contagem: TipoContagem | null };

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Procura "prazo de N dias" (em algarismos, com ou sem o número por extenso
 * entre parênteses, ou só por extenso). Retorna null se não houver menção ou
 * se houver números de dias diferentes no texto (ambíguo — melhor a
 * advogada definir do que o sistema escolher errado).
 */
export type ContextoCliente = { nomeCliente: string; poloCliente: PoloProcessual | null };

export type ResultadoIdentificacao =
  | ({ tipo: "prazo" } & PrazoIdentificado)
  | { tipo: "parte_contraria"; dias: number; destinatario: string };

/**
 * Procura "prazo de N dias" (em algarismos, com ou sem o número por extenso
 * entre parênteses, ou só por extenso). Com o contexto do cliente, descarta
 * as ordens dirigidas à parte contrária ("intime-se a parte ré para…"). Retorna
 * null se não houver menção ou se sobrarem números de dias diferentes (ambíguo
 * — melhor a advogada definir do que o sistema escolher errado).
 */
export function identificarPrazoNoTexto(
  textoOriginal: string,
  contexto?: ContextoCliente
): ResultadoIdentificacao | null {
  const texto = normalizarTexto(textoOriginal);
  const extenso = Object.keys(NUMEROS_POR_EXTENSO).join("|");
  const padrao = new RegExp(
    `prazo(?: comum| sucessivo| improrrogavel| legal)?(?: de| em)? (\\d{1,3}|${extenso})(?: ?\\([^)]{1,30}\\))? dias?( uteis| corridos)?`,
    "g"
  );

  const doCliente: PrazoIdentificado[] = [];
  const daContraria: { dias: number; frase: string }[] = [];
  for (const match of texto.matchAll(padrao)) {
    const numero = /^\d+$/.test(match[1]) ? Number(match[1]) : NUMEROS_POR_EXTENSO[match[1]];
    if (!numero || numero > 365) continue;
    const contagem =
      match[2] === " uteis" ? "DIAS_UTEIS" : match[2] === " corridos" ? "DIAS_CORRIDOS" : null;
    const destinatario = contexto
      ? classificarDestinatario(
          fraseAoRedor(texto, match.index, match.index + match[0].length),
          contexto.nomeCliente,
          contexto.poloCliente
        )
      : "indefinido";
    if (destinatario === "contraria") {
      daContraria.push({ dias: numero, frase: fraseAoRedor(texto, match.index, match.index + match[0].length) });
    } else {
      doCliente.push({ dias: numero, contagem });
    }
  }

  if (doCliente.length === 0) {
    if (daContraria.length === 0) return null;
    return {
      tipo: "parte_contraria",
      dias: daContraria[0].dias,
      destinatario: contexto?.poloCliente === "ATIVO" ? "polo passivo" : "polo ativo",
    };
  }
  const diasDistintos = new Set(doCliente.map((item) => item.dias));
  if (diasDistintos.size > 1) return null;
  return { tipo: "prazo", ...(doCliente.find((item) => item.contagem) ?? doCliente[0]) };
}

/** Data da disponibilização (como gravada) → meia-noite UTC do mesmo dia civil. */
function diaCivilUtc(data: Date): Date {
  return new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
}

/** Considera-se publicada no 1º dia útil seguinte à disponibilização no DJEN. */
export function dataPublicacaoEfetiva(dataDisponibilizacao: Date): Date {
  return proximoDiaUtil(diaCivilUtc(dataDisponibilizacao));
}

export function calcularVencimentoPublicacao(
  dataDisponibilizacao: Date,
  dias: number,
  contagem: TipoContagem
): { dataBase: Date; dataFinal: Date } {
  const dataBase = dataPublicacaoEfetiva(dataDisponibilizacao);
  let dataFinal = calcularDataFinal(dataBase, dias, contagem);
  // Em dias corridos, vencimento em dia não útil prorroga para o próximo dia útil.
  if (contagem === "DIAS_CORRIDOS" && !ehDiaUtil(dataFinal)) {
    dataFinal = proximoDiaUtil(dataFinal);
  }
  return { dataBase, dataFinal };
}

/**
 * Após vincular a publicação a um processo: cria o prazo "a conferir" se o
 * texto informa os dias, ou marca a publicação como "prazo a definir".
 */
/**
 * Polo do cliente no processo: o cadastrado ou, se vazio, o inferido do
 * texto da publicação (e já gravado no processo para as próximas).
 */
async function poloDoCliente(
  processoId: string,
  poloAtual: PoloProcessual | null,
  textoNormalizado: string,
  nomeCliente: string
): Promise<PoloProcessual | null> {
  if (poloAtual) return poloAtual;
  const inferido = inferirPoloCliente(textoNormalizado, nomeCliente);
  if (inferido) {
    await prisma.processo.update({ where: { id: processoId }, data: { poloCliente: inferido } });
    // Com o polo agora conhecido, revisa prazos gerados antes neste processo.
    await revisarPrazosGeradosDoProcesso(processoId);
  }
  return inferido;
}

export type ResultadoPrazoPublicacao = "criado" | "a_definir" | "parte_contraria" | "ignorado";

export async function gerarPrazoDaPublicacao(
  publicacaoId: string,
  origemAndamentoId: string | null,
  opcoes: { temAudiencia?: boolean } = {}
): Promise<ResultadoPrazoPublicacao> {
  const publicacao = await prisma.publicacao.findUnique({
    where: { id: publicacaoId },
    include: {
      processo: { select: { area: true, poloCliente: true, cliente: { select: { nome: true } } } },
      // A audiência captada da mesma publicação não conta como "prazo já criado".
      prazos: { where: { tipo: { not: "AUDIENCIA" } }, select: { id: true } },
    },
  });
  if (!publicacao?.processoId || !publicacao.processo || publicacao.prazos.length > 0) {
    return "ignorado";
  }

  const nomeCliente = publicacao.processo.cliente.nome;
  const poloCliente = await poloDoCliente(
    publicacao.processoId,
    publicacao.processo.poloCliente,
    normalizarTexto(publicacao.textoPublicacao),
    nomeCliente
  );
  const identificado = identificarPrazoNoTexto(publicacao.textoPublicacao, { nomeCliente, poloCliente });

  // Ordem dirigida só à parte contrária: o escritório foi intimado para ciência.
  if (identificado?.tipo === "parte_contraria") {
    await prisma.publicacao.update({
      where: { id: publicacaoId },
      data: {
        prazoADefinir: false,
        observacaoPrazo: `O prazo de ${identificado.dias} dias desta publicação é da parte contrária (${identificado.destinatario}) — não foi cadastrado como prazo do escritório.`,
      },
    });
    return "parte_contraria";
  }

  // Intimação de audiência sem prazo em dias: não é "prazo a definir".
  if (!identificado && opcoes.temAudiencia) return "ignorado";
  if (!identificado) {
    await prisma.publicacao.update({
      where: { id: publicacaoId },
      data: { prazoADefinir: true },
    });
    return "a_definir";
  }

  // Sem indicação no texto: processo penal conta em dias corridos (CPP, art.
  // 798); os demais, em dias úteis (CPC, art. 219).
  const contagem: TipoContagem =
    identificado.contagem ?? (publicacao.processo.area === "PENAL" ? "DIAS_CORRIDOS" : "DIAS_UTEIS");
  const { dataBase, dataFinal } = calcularVencimentoPublicacao(
    publicacao.dataPublicacao,
    identificado.dias,
    contagem
  );

  await prisma.prazo.create({
    data: {
      processoId: publicacao.processoId,
      tipo: "MANIFESTACAO",
      dataBase,
      dias: identificado.dias,
      contagem,
      dataFinal,
      aConferir: true,
      origemPublicacaoId: publicacao.id,
      origemAndamentoId,
      observacoes: `Gerado automaticamente da publicação do DJEN (${identificado.dias} dias). Confira o tipo, a contagem e o vencimento.`,
    },
  });
  await prisma.publicacao.update({
    where: { id: publicacaoId },
    data: { prazoADefinir: false, observacaoPrazo: null },
  });
  return "criado";
}

/**
 * Revisa os prazos ainda "a conferir" gerados de publicações deste processo:
 * os que, com o polo do cliente conhecido, se revelam da parte contrária são
 * removidos (e a publicação registra o motivo). Chamada ao definir o polo.
 */
export async function revisarPrazosGeradosDoProcesso(processoId: string): Promise<number> {
  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    select: { poloCliente: true, cliente: { select: { nome: true } } },
  });
  if (!processo?.poloCliente) return 0;

  const prazos = await prisma.prazo.findMany({
    where: { processoId, aConferir: true, tipo: { not: "AUDIENCIA" }, origemPublicacaoId: { not: null } },
    include: { origemPublicacao: true },
  });

  let removidos = 0;
  for (const prazo of prazos) {
    if (!prazo.origemPublicacao) continue;
    const r = identificarPrazoNoTexto(prazo.origemPublicacao.textoPublicacao, {
      nomeCliente: processo.cliente.nome,
      poloCliente: processo.poloCliente,
    });
    if (r?.tipo !== "parte_contraria") continue;
    await prisma.prazo.delete({ where: { id: prazo.id } });
    await prisma.publicacao.update({
      where: { id: prazo.origemPublicacao.id },
      data: {
        observacaoPrazo: `O prazo de ${r.dias} dias desta publicação é da parte contrária (${r.destinatario}) — o prazo gerado antes foi removido.`,
      },
    });
    removidos += 1;
  }
  return removidos;
}
