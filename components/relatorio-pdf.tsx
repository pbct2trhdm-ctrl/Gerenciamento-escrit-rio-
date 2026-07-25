import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatarMoeda } from "@/lib/formatacao";
import { NOME_ESCRITORIO, CNPJ_ESCRITORIO } from "@/lib/escritorio";
import {
  calcularVariacao,
  formatarPeriodo,
  type RelatorioFinanceiro,
  type SecaoRelatorio,
  type LinhaRelatorio,
} from "@/lib/relatorio";

const CorTexto = "#0F172A";
const CorSecundaria = "#64748B";
const CorBorda = "#E2E8F0";
const CorTranquilo = "#166534";
const CorCritico = "#991B1B";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: CorTexto,
    fontFamily: "Helvetica",
  },
  cabecalho: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: CorBorda,
    borderBottomStyle: "solid",
  },
  nomeEscritorio: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  linhaCabecalho: {
    fontSize: 9,
    color: CorSecundaria,
    marginTop: 2,
  },
  secao: {
    marginBottom: 18,
  },
  tituloSecao: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  linhaTabela: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: CorBorda,
    borderBottomStyle: "solid",
    paddingVertical: 4,
  },
  linhaSubtotal: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: CorTexto,
    borderTopStyle: "solid",
    paddingVertical: 4,
    fontWeight: 700,
  },
  colLabel: { flex: 2 },
  colValor: { flex: 1, textAlign: "right" },
  saldoBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
  },
  saldoLabel: { fontSize: 10, color: CorSecundaria },
  saldoValor: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  saldoVariacao: { fontSize: 9, marginTop: 4, color: CorSecundaria },
  rodape: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: CorSecundaria,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: CorBorda,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
});

function corVariacao(absoluta: number, aumentoEhBom: boolean): string {
  if (absoluta === 0) return CorSecundaria;
  const aumentou = absoluta > 0;
  const favoravel = (aumentou && aumentoEhBom) || (!aumentou && !aumentoEhBom);
  return favoravel ? CorTranquilo : CorCritico;
}

function textoVariacao(valor: number, valorAnterior: number | null): string {
  const variacao = calcularVariacao(valor, valorAnterior);
  if (!variacao) return "—";
  // Helvetica (fonte padrão do PDF) não tem glifos para ▲/▼ — usa marcadores ASCII.
  const seta = variacao.absoluta >= 0 ? "+" : "-";
  const percentualTexto =
    variacao.percentual !== null
      ? ` (${variacao.percentual >= 0 ? "+" : ""}${variacao.percentual.toFixed(1)}%)`
      : "";
  return `${seta} ${formatarMoeda(Math.abs(variacao.absoluta))}${percentualTexto}`;
}

function LinhaPdf({
  linha,
  comparar,
  aumentoEhBom,
  negrito,
}: {
  linha: LinhaRelatorio;
  comparar: boolean;
  aumentoEhBom: boolean;
  negrito?: boolean;
}) {
  const variacao = calcularVariacao(linha.valor, linha.valorAnterior);
  return (
    <View style={negrito ? styles.linhaSubtotal : styles.linhaTabela}>
      <Text style={styles.colLabel}>{linha.label}</Text>
      <Text style={styles.colValor}>{formatarMoeda(linha.valor)}</Text>
      {comparar && (
        <>
          <Text style={[styles.colValor, { color: CorSecundaria }]}>
            {linha.valorAnterior !== null ? formatarMoeda(linha.valorAnterior) : "—"}
          </Text>
          <Text
            style={[
              styles.colValor,
              { color: variacao ? corVariacao(variacao.absoluta, aumentoEhBom) : CorSecundaria },
            ]}
          >
            {textoVariacao(linha.valor, linha.valorAnterior)}
          </Text>
        </>
      )}
    </View>
  );
}

function SecaoPdf({ secao, comparar }: { secao: SecaoRelatorio; comparar: boolean }) {
  return (
    <View style={styles.secao} wrap={false}>
      <Text style={styles.tituloSecao}>{secao.titulo}</Text>
      {secao.linhas.map((linhaItem) => (
        <LinhaPdf
          key={linhaItem.label}
          linha={linhaItem}
          comparar={comparar}
          aumentoEhBom={secao.aumentoEhBom}
        />
      ))}
      <LinhaPdf linha={secao.subtotal} comparar={comparar} aumentoEhBom={secao.aumentoEhBom} negrito />
    </View>
  );
}

export function RelatorioPdfDocumento({
  relatorio,
  comparar,
}: {
  relatorio: RelatorioFinanceiro;
  comparar: boolean;
}) {
  const geradoEm = new Date();
  const dataGeracao = geradoEm.toLocaleDateString("pt-BR");
  const horaGeracao = geradoEm.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document title={`Relatório financeiro — ${formatarPeriodo(relatorio.periodo)}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.cabecalho}>
          <Text style={styles.nomeEscritorio}>{NOME_ESCRITORIO}</Text>
          <Text style={styles.linhaCabecalho}>CNPJ {CNPJ_ESCRITORIO}</Text>
          <Text style={styles.linhaCabecalho}>
            Período de referência: {formatarPeriodo(relatorio.periodo)}
            {comparar && relatorio.periodoAnterior
              ? ` · Comparando com ${formatarPeriodo(relatorio.periodoAnterior)}`
              : ""}
          </Text>
          <Text style={styles.linhaCabecalho}>
            Gerado em {dataGeracao} às {horaGeracao}
          </Text>
        </View>

        <SecaoPdf secao={relatorio.receitas} comparar={comparar} />
        <SecaoPdf secao={relatorio.despesas} comparar={comparar} />
        <SecaoPdf secao={relatorio.obrigacoes} comparar={comparar} />

        <View style={styles.saldoBox}>
          <Text style={styles.saldoLabel}>{relatorio.saldo.label}</Text>
          <Text style={styles.saldoValor}>{formatarMoeda(relatorio.saldo.valor)}</Text>
          {comparar && relatorio.saldo.valorAnterior !== null && (
            <Text style={styles.saldoVariacao}>
              Período anterior: {formatarMoeda(relatorio.saldo.valorAnterior)} ·{" "}
              {textoVariacao(relatorio.saldo.valor, relatorio.saldo.valorAnterior)}
            </Text>
          )}
        </View>

        <Text
          style={styles.rodape}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
