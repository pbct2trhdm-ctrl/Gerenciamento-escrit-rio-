import { renderToBuffer } from "@react-pdf/renderer";
import { gerarRelatorioFinanceiro, periodoDaQuery } from "@/lib/relatorio";
import { competenciaParaString } from "@/lib/financeiro";
import { RelatorioPdfDocumento } from "@/components/relatorio-pdf";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const periodo = periodoDaQuery(params);
  const comparar = params.comparar === "on";

  const relatorio = await gerarRelatorioFinanceiro(periodo, comparar);
  const buffer = await renderToBuffer(
    <RelatorioPdfDocumento relatorio={relatorio} comparar={comparar} />
  );

  const sufixoArquivo =
    periodo.tipo === "mes"
      ? competenciaParaString(periodo.inicio)
      : `${url.searchParams.get("dataInicio")}_a_${url.searchParams.get("dataFim")}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-financeiro-${sufixoArquivo}.pdf"`,
    },
  });
}
