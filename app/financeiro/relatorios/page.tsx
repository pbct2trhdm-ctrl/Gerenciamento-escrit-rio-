import { gerarRelatorioFinanceiro, periodoDaQuery, formatarPeriodo } from "@/lib/relatorio";
import { competenciaParaString, primeiroDiaMes } from "@/lib/financeiro";
import { NOME_ESCRITORIO, CNPJ_ESCRITORIO } from "@/lib/escritorio";
import { RelatorioFiltro } from "@/components/relatorio-filtro";
import { SecaoTabela, CartaoSaldo } from "@/components/relatorio-tabela";
import { classeTituloSecao, classeCard, classeBotaoPrimario } from "@/lib/estilos";

function paraInputDate(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipoPeriodo?: string;
    mes?: string;
    dataInicio?: string;
    dataFim?: string;
    comparar?: string;
  }>;
}) {
  const params = await searchParams;
  const periodo = periodoDaQuery(params);
  const comparar = params.comparar === "on";
  const relatorio = await gerarRelatorioFinanceiro(periodo, comparar);

  const mesAtualStr = competenciaParaString(
    periodo.tipo === "mes" ? periodo.inicio : primeiroDiaMes(new Date())
  );

  const queryPdf = new URLSearchParams({
    tipoPeriodo: periodo.tipo,
    ...(periodo.tipo === "mes"
      ? { mes: mesAtualStr }
      : { dataInicio: paraInputDate(periodo.inicio), dataFim: paraInputDate(periodo.fim) }),
    ...(comparar ? { comparar: "on" } : {}),
  }).toString();

  return (
    <div>
      <RelatorioFiltro
        tipoPeriodoInicial={periodo.tipo}
        mesInicial={mesAtualStr}
        dataInicioInicial={paraInputDate(periodo.inicio)}
        dataFimInicial={paraInputDate(periodo.fim)}
        compararInicial={comparar}
      />

      <div className={`${classeCard} mb-8 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className={classeTituloSecao}>{NOME_ESCRITORIO}</p>
          <p className="text-sm text-texto-secundario">CNPJ {CNPJ_ESCRITORIO}</p>
          <p className="text-sm text-texto-secundario mt-1">
            Período de referência: {formatarPeriodo(relatorio.periodo)}
            {comparar && relatorio.periodoAnterior && (
              <> · Comparando com {formatarPeriodo(relatorio.periodoAnterior)}</>
            )}
          </p>
        </div>
        <a href={`/financeiro/relatorios/pdf?${queryPdf}`} className={classeBotaoPrimario}>
          Gerar PDF
        </a>
      </div>

      <div className="space-y-8">
        <SecaoTabela secao={relatorio.receitas} comparar={comparar} />
        <SecaoTabela secao={relatorio.despesas} comparar={comparar} />
        <SecaoTabela secao={relatorio.obrigacoes} comparar={comparar} />
        <CartaoSaldo linha={relatorio.saldo} comparar={comparar} />
      </div>
    </div>
  );
}
