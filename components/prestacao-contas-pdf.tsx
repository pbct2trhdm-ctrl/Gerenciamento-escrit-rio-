import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatarData, formatarMoeda } from "@/lib/formatacao";
import {
  NOME_ESCRITORIO,
  CNPJ_ESCRITORIO,
  ENDERECO_ESCRITORIO,
  CONTATO_ESCRITORIO,
} from "@/lib/escritorio";
import { calcularAlvara } from "@/lib/alvara";

const CorTexto = "#13303F";
const CorSecundaria = "#5F6466";
const CorBorda = "#E2E8F0";
const CaminhoLogo = path.join(process.cwd(), "public", "logo.png");

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: CorTexto, fontFamily: "Helvetica", lineHeight: 1.4 },
  logo: { width: 190, marginBottom: 8 },
  cabecalho: { marginBottom: 18, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: CorBorda, borderBottomStyle: "solid" },
  linhaCabecalho: { fontSize: 8.5, color: CorSecundaria },
  titulo: { fontSize: 14, fontWeight: 700, marginBottom: 12, textAlign: "center" },
  bloco: { marginBottom: 14 },
  rotulo: { fontSize: 8.5, color: CorSecundaria },
  linha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: CorBorda, borderBottomStyle: "solid" },
  linhaTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: 1, borderTopColor: CorTexto, borderTopStyle: "solid", fontWeight: 700 },
  declaracao: { marginTop: 18, textAlign: "justify" },
  assinaturas: { marginTop: 48, flexDirection: "row", justifyContent: "space-between" },
  assinatura: { width: "45%", borderTopWidth: 0.8, borderTopColor: CorTexto, borderTopStyle: "solid", paddingTop: 4, fontSize: 8.5, textAlign: "center" },
  rodape: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 7.5, color: CorSecundaria, textAlign: "center" },
});

export type DadosPrestacaoContas = {
  valorTotal: number;
  impostoRetido: number;
  tarifas: number;
  honorariosContratuais: number;
  honorariosSucumbencia: number;
  reembolsoDespesas: number;
  percentualContratual: number | null;
  dataRecebimento: Date | null;
  dataRepasse: Date | null;
  bancoDestino: string | null;
  agenciaDestino: string | null;
  contaDestino: string | null;
  chavePixDestino: string | null;
  observacoes: string | null;
  cliente: { nome: string; cpfCnpj: string | null };
  processo: { numeroProcesso: string | null; orgao: string | null };
};

function LinhaValor({ rotulo, valor, sinal }: { rotulo: string; valor: number; sinal?: "-" }) {
  if (sinal === "-" && valor === 0) return null;
  return (
    <View style={styles.linha}>
      <Text>{sinal === "-" ? `(-) ${rotulo}` : rotulo}</Text>
      <Text>{formatarMoeda(valor)}</Text>
    </View>
  );
}

export function PrestacaoContasPdf({ dados }: { dados: DadosPrestacaoContas }) {
  const calculo = calcularAlvara(dados);
  const contaRepasse = [
    dados.bancoDestino && `Banco ${dados.bancoDestino}`,
    dados.agenciaDestino && `agência ${dados.agenciaDestino}`,
    dados.contaDestino && `conta ${dados.contaDestino}`,
    dados.chavePixDestino && `Pix ${dados.chavePixDestino}`,
  ]
    .filter(Boolean)
    .join(", ");
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document title={`Prestação de contas — ${dados.cliente.nome}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.cabecalho}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não aceita alt */}
          <Image src={CaminhoLogo} style={styles.logo} />
          <Text style={styles.linhaCabecalho}>
            {NOME_ESCRITORIO} · CNPJ {CNPJ_ESCRITORIO}
          </Text>
          <Text style={styles.linhaCabecalho}>{ENDERECO_ESCRITORIO}</Text>
          <Text style={styles.linhaCabecalho}>{CONTATO_ESCRITORIO}</Text>
        </View>

        <Text style={styles.titulo}>PRESTAÇÃO DE CONTAS — ALVARÁ JUDICIAL</Text>

        <View style={styles.bloco}>
          <Text style={styles.rotulo}>Cliente</Text>
          <Text>
            {dados.cliente.nome}
            {dados.cliente.cpfCnpj ? ` — CPF/CNPJ ${dados.cliente.cpfCnpj}` : ""}
          </Text>
          <Text style={[styles.rotulo, { marginTop: 6 }]}>Processo</Text>
          <Text>
            {dados.processo.numeroProcesso ?? "Sem número"}
            {dados.processo.orgao ? ` — ${dados.processo.orgao}` : ""}
          </Text>
          {dados.dataRecebimento && (
            <>
              <Text style={[styles.rotulo, { marginTop: 6 }]}>Data do recebimento do alvará</Text>
              <Text>{formatarData(dados.dataRecebimento)}</Text>
            </>
          )}
        </View>

        <View style={styles.bloco}>
          <LinhaValor rotulo="Valor bruto do alvará" valor={dados.valorTotal} />
          <LinhaValor rotulo="Imposto de renda retido na fonte" valor={dados.impostoRetido} sinal="-" />
          <LinhaValor rotulo="Tarifas bancárias" valor={dados.tarifas} sinal="-" />
          <View style={styles.linhaTotal}>
            <Text>(=) Valor líquido recebido</Text>
            <Text>{formatarMoeda(calculo.valorLiquido)}</Text>
          </View>
          <LinhaValor
            rotulo={`Honorários contratuais${
              dados.percentualContratual
                ? ` (${dados.percentualContratual}% sobre ${formatarMoeda(calculo.baseContratual)}, conforme contrato)`
                : " (conforme contrato)"
            }`}
            valor={dados.honorariosContratuais}
            sinal="-"
          />
          <LinhaValor
            rotulo="Honorários de sucumbência (do advogado — Lei 8.906/1994, art. 23)"
            valor={dados.honorariosSucumbencia}
            sinal="-"
          />
          <LinhaValor
            rotulo="Reembolso de despesas processuais adiantadas pelo escritório"
            valor={dados.reembolsoDespesas}
            sinal="-"
          />
          <View style={styles.linhaTotal}>
            <Text>(=) Valor repassado ao cliente</Text>
            <Text>{formatarMoeda(calculo.valorRepassado)}</Text>
          </View>
          {(dados.dataRepasse || contaRepasse) && (
            <Text style={{ marginTop: 6, fontSize: 9 }}>
              Repasse
              {dados.dataRepasse ? ` em ${formatarData(dados.dataRepasse)}` : ""}
              {contaRepasse ? `, para ${contaRepasse}` : ""}.
            </Text>
          )}
          {dados.observacoes && (
            <Text style={{ marginTop: 6, fontSize: 9, color: CorSecundaria }}>Observações: {dados.observacoes}</Text>
          )}
        </View>

        <Text style={styles.declaracao}>
          Declaro ter recebido de {NOME_ESCRITORIO} a importância de{" "}
          {formatarMoeda(calculo.valorRepassado)}, correspondente ao valor líquido que me cabe do
          alvará judicial expedido no processo acima, após as deduções discriminadas neste
          demonstrativo, com as quais concordo, e dou plena e geral quitação quanto aos valores
          recebidos por meio deste alvará.
        </Text>

        <Text style={{ marginTop: 18 }}>Belém/PA, {hoje}.</Text>

        <View style={styles.assinaturas}>
          <Text style={styles.assinatura}>{dados.cliente.nome}{"\n"}Cliente</Text>
          <Text style={styles.assinatura}>{NOME_ESCRITORIO}</Text>
        </View>

        <Text style={styles.rodape} fixed>
          Prestação de contas gerada pelo sistema de gestão do escritório.
        </Text>
      </Page>
    </Document>
  );
}
