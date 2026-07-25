import { prisma } from "@/lib/prisma";
import {
  primeiroDiaMes,
  competenciaDeString,
  mesAdjacente,
} from "@/lib/financeiro";
import {
  LABEL_CATEGORIA_DESPESA,
  LABEL_TIPO_OBRIGACAO,
  formatarData,
  formatarCompetencia,
} from "@/lib/formatacao";

const CATEGORIAS_DESPESA = ["CUSTAS", "ALUGUEL", "MATERIAL", "OUTRO"] as const;
const TIPOS_OBRIGACAO = ["PRO_LABORE", "DAS", "INSS_SOCIO", "CPP_PATRONAL"] as const;

export type TipoPeriodo = "mes" | "intervalo";

export type Periodo = {
  tipo: TipoPeriodo;
  inicio: Date;
  fim: Date;
};

export type LinhaRelatorio = {
  label: string;
  valor: number;
  valorAnterior: number | null;
};

export type SecaoRelatorio = {
  titulo: string;
  linhas: LinhaRelatorio[];
  subtotal: LinhaRelatorio;
  /** Um aumento no valor é boa notícia (receitas) ou má notícia (despesas/obrigações)? Define a cor da variação. */
  aumentoEhBom: boolean;
};

export type RelatorioFinanceiro = {
  periodo: Periodo;
  periodoAnterior: Periodo | null;
  receitas: SecaoRelatorio;
  despesas: SecaoRelatorio;
  obrigacoes: SecaoRelatorio;
  saldo: LinhaRelatorio;
};

function parseDataUTC(texto: string): Date {
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function ultimoDiaMes(competencia: Date): Date {
  return new Date(Date.UTC(competencia.getUTCFullYear(), competencia.getUTCMonth() + 1, 0));
}

/** Resolve o período a partir dos parâmetros de busca da página/rota do PDF — mesma lógica para os dois. */
export function periodoDaQuery(params: {
  tipoPeriodo?: string;
  mes?: string;
  dataInicio?: string;
  dataFim?: string;
}): Periodo {
  if (params.tipoPeriodo === "intervalo" && params.dataInicio && params.dataFim) {
    return {
      tipo: "intervalo",
      inicio: parseDataUTC(params.dataInicio),
      fim: parseDataUTC(params.dataFim),
    };
  }
  const competencia = params.mes ? competenciaDeString(params.mes) : primeiroDiaMes(new Date());
  return { tipo: "mes", inicio: competencia, fim: ultimoDiaMes(competencia) };
}

/**
 * Período anterior equivalente: mês de calendário anterior quando o período é
 * um mês específico; mesma quantidade de dias imediatamente anterior quando é
 * um intervalo customizado.
 */
export function periodoAnterior(periodo: Periodo): Periodo {
  if (periodo.tipo === "mes") {
    const mesAnt = mesAdjacente(periodo.inicio, -1);
    return { tipo: "mes", inicio: mesAnt, fim: ultimoDiaMes(mesAnt) };
  }
  const duracaoDias =
    Math.round((periodo.fim.getTime() - periodo.inicio.getTime()) / 86400000) + 1;
  const fimAnterior = new Date(periodo.inicio.getTime() - 86400000);
  const inicioAnterior = new Date(fimAnterior.getTime() - (duracaoDias - 1) * 86400000);
  return { tipo: "intervalo", inicio: inicioAnterior, fim: fimAnterior };
}

export function formatarPeriodo(periodo: Periodo): string {
  if (periodo.tipo === "mes") {
    return formatarCompetencia(periodo.inicio);
  }
  return `${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;
}

export function calcularVariacao(
  valor: number,
  valorAnterior: number | null
): { absoluta: number; percentual: number | null } | null {
  if (valorAnterior === null) return null;
  const absoluta = valor - valorAnterior;
  const percentual = valorAnterior !== 0 ? (absoluta / Math.abs(valorAnterior)) * 100 : null;
  return { absoluta, percentual };
}

type TotaisBrutos = {
  honorarios: number;
  sucumbencia: number;
  alvaras: number;
  despesasPorCategoria: Record<string, number>;
  obrigacoesPorTipo: Record<string, number>;
  retiradas: number;
};

async function calcularTotais(periodo: Periodo): Promise<TotaisBrutos> {
  const { inicio, fim } = periodo;

  const [parcelasPagas, sucumbenciasRecebidas, alvaras, despesas, obrigacoesPagas, retiradas] =
    await Promise.all([
      prisma.parcela.findMany({
        where: { status: "PAGO", dataPagamento: { gte: inicio, lte: fim } },
      }),
      prisma.honorarioSucumbencial.findMany({
        where: { status: "RECEBIDO", dataRecebimento: { gte: inicio, lte: fim } },
      }),
      prisma.alvara.findMany({
        where: { dataRecebimento: { gte: inicio, lte: fim } },
      }),
      prisma.despesa.findMany({ where: { data: { gte: inicio, lte: fim } } }),
      prisma.obrigacaoSocietaria.findMany({
        where: { status: "PAGO", dataPagamento: { gte: inicio, lte: fim } },
      }),
      prisma.retiradaLucro.findMany({ where: { data: { gte: inicio, lte: fim } } }),
    ]);

  const despesasPorCategoria: Record<string, number> = {};
  for (const categoria of CATEGORIAS_DESPESA) despesasPorCategoria[categoria] = 0;
  for (const d of despesas) {
    despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] ?? 0) + d.valor;
  }

  const obrigacoesPorTipo: Record<string, number> = {};
  for (const tipo of TIPOS_OBRIGACAO) obrigacoesPorTipo[tipo] = 0;
  for (const o of obrigacoesPagas) {
    obrigacoesPorTipo[o.tipo] = (obrigacoesPorTipo[o.tipo] ?? 0) + o.valor;
  }

  return {
    honorarios: parcelasPagas.reduce((soma, p) => soma + p.valor, 0),
    sucumbencia: sucumbenciasRecebidas.reduce(
      (soma, s) => soma + (s.valorDefinido ?? s.valorEstimado ?? 0),
      0
    ),
    alvaras: alvaras.reduce((soma, a) => soma + a.valorRetido, 0),
    despesasPorCategoria,
    obrigacoesPorTipo,
    retiradas: retiradas.reduce((soma, r) => soma + r.valor, 0),
  };
}

function linha(label: string, valor: number, valorAnterior: number | null): LinhaRelatorio {
  return { label, valor, valorAnterior };
}

function montarSecao(
  titulo: string,
  linhas: LinhaRelatorio[],
  aumentoEhBom: boolean,
  comparar: boolean
): SecaoRelatorio {
  const valor = linhas.reduce((soma, l) => soma + l.valor, 0);
  const valorAnterior = comparar
    ? linhas.reduce((soma, l) => soma + (l.valorAnterior ?? 0), 0)
    : null;
  return {
    titulo,
    linhas,
    subtotal: linha("Subtotal", valor, valorAnterior),
    aumentoEhBom,
  };
}

/** Monta o relatório financeiro completo — usado tanto na prévia quanto na geração do PDF, garantindo a mesma lógica nos dois. */
export async function gerarRelatorioFinanceiro(
  periodo: Periodo,
  comparar: boolean
): Promise<RelatorioFinanceiro> {
  const anterior = comparar ? periodoAnterior(periodo) : null;

  const [atual, brutoAnterior] = await Promise.all([
    calcularTotais(periodo),
    anterior ? calcularTotais(anterior) : Promise.resolve(null),
  ]);

  const receitasLinhas: LinhaRelatorio[] = [
    linha("Honorários recebidos", atual.honorarios, brutoAnterior?.honorarios ?? null),
    linha("Sucumbência recebida", atual.sucumbencia, brutoAnterior?.sucumbencia ?? null),
    linha("Valor retido de alvarás", atual.alvaras, brutoAnterior?.alvaras ?? null),
  ];

  const despesasLinhas: LinhaRelatorio[] = CATEGORIAS_DESPESA.map((categoria) =>
    linha(
      LABEL_CATEGORIA_DESPESA[categoria],
      atual.despesasPorCategoria[categoria],
      brutoAnterior?.despesasPorCategoria[categoria] ?? null
    )
  );

  const obrigacoesLinhas: LinhaRelatorio[] = [
    ...TIPOS_OBRIGACAO.map((tipo) =>
      linha(
        LABEL_TIPO_OBRIGACAO[tipo],
        atual.obrigacoesPorTipo[tipo],
        brutoAnterior?.obrigacoesPorTipo[tipo] ?? null
      )
    ),
    linha("Retiradas de lucro", atual.retiradas, brutoAnterior?.retiradas ?? null),
  ];

  const receitas = montarSecao("Receitas", receitasLinhas, true, comparar);
  const despesas = montarSecao("Despesas operacionais", despesasLinhas, false, comparar);
  const obrigacoes = montarSecao("Obrigações do sócio", obrigacoesLinhas, false, comparar);

  const valorSaldo = receitas.subtotal.valor - despesas.subtotal.valor - obrigacoes.subtotal.valor;
  const valorSaldoAnterior = comparar
    ? (receitas.subtotal.valorAnterior ?? 0) -
      (despesas.subtotal.valorAnterior ?? 0) -
      (obrigacoes.subtotal.valorAnterior ?? 0)
    : null;

  return {
    periodo,
    periodoAnterior: anterior,
    receitas,
    despesas,
    obrigacoes,
    saldo: linha("Saldo do período", valorSaldo, valorSaldoAnterior),
  };
}
