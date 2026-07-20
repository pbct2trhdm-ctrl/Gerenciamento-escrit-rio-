import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_HONORARIO,
  LABEL_STATUS_PARCELA,
  formatarMoeda,
  formatarData,
} from "@/lib/formatacao";
import { statusEfetivoParcela } from "@/lib/financeiro";
import { tierParcela } from "@/lib/urgencia";
import { excluirHonorario } from "@/lib/actions/honorarios";
import {
  criarParcela,
  marcarParcelaPaga,
  marcarNotaFiscalParcela,
  excluirParcela,
} from "@/lib/actions/honorarios";
import { ParcelaForm } from "@/components/parcela-form";
import { Badge } from "@/components/badge";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeBotaoConfirma,
  classeCard,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function HonorarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const honorario = await prisma.honorario.findUnique({
    where: { id },
    include: {
      processo: { include: { cliente: true } },
      parcelas: { orderBy: { numero: "asc" } },
    },
  });

  if (!honorario) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <LinkVoltar href="/financeiro/honorarios" label="Voltar para Honorários" />
      <div className="flex items-center justify-between mb-1">
        <h2 className={classeTituloPagina}>
          {honorario.processo.cliente.nome} — {LABEL_TIPO_HONORARIO[honorario.tipo]}
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/financeiro/honorarios/${honorario.id}/editar`}
            className={classeBotaoSecundario}
          >
            Editar
          </Link>
          <form action={excluirHonorario.bind(null, honorario.id)}>
            <button type="submit" className={classeBotaoPerigo}>
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-texto-secundario mb-6">
        <Link href={`/processos/${honorario.processo.id}`} className="underline">
          {honorario.processo.numeroProcesso ?? "Processo sem número"}
        </Link>{" "}
        · Contrato em <span className="tabular-nums">{formatarData(honorario.dataContrato)}</span>
      </p>

      <div className={`grid grid-cols-2 gap-4 mb-8 text-sm ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">Valor total</p>
          <p className="tabular-nums">
            {honorario.valorTotal != null ? formatarMoeda(honorario.valorTotal) : "—"}
          </p>
        </div>
        <div>
          <p className="text-texto-secundario">% de êxito</p>
          <p className="tabular-nums">
            {honorario.percentualExito != null ? `${honorario.percentualExito}%` : "—"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-texto-secundario">Observações</p>
          <p className="whitespace-pre-wrap">{honorario.observacoes || "—"}</p>
        </div>
      </div>

      <h3 className={`${classeTituloSecao} mb-3`}>Parcelas</h3>

      {honorario.parcelas.length === 0 ? (
        <p className="text-texto-secundario mb-6 text-sm">Nenhuma parcela cadastrada.</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {honorario.parcelas.map((parcela) => {
            const statusEfetivo = statusEfetivoParcela(parcela);
            const tier = tierParcela(parcela);
            return (
              <li
                key={parcela.id}
                className={`rounded-lg border bg-superficie p-4 ${
                  tier === "critico" ? "border-critico/30" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium tabular-nums">
                      Parcela {parcela.numero} — {formatarMoeda(parcela.valor)}
                    </p>
                    <p className="text-sm text-texto-secundario tabular-nums">
                      Vencimento {formatarData(parcela.vencimento)}
                      {parcela.dataPagamento &&
                        ` · Pago em ${formatarData(parcela.dataPagamento)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tier={tier}>{LABEL_STATUS_PARCELA[statusEfetivo]}</Badge>
                    <p className="text-xs text-texto-secundario mt-1">
                      NF: {parcela.notaFiscalEmitida ? "emitida" : "pendente"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Link
                    href={`/financeiro/honorarios/${honorario.id}/parcelas/${parcela.id}/editar`}
                    className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                  >
                    Editar
                  </Link>
                  {parcela.status !== "PAGO" && (
                    <form action={marcarParcelaPaga.bind(null, parcela.id)}>
                      <button
                        type="submit"
                        className={`${classeBotaoConfirma} !px-3 !py-1 text-xs`}
                      >
                        Marcar como pago
                      </button>
                    </form>
                  )}
                  {!parcela.notaFiscalEmitida && (
                    <form action={marcarNotaFiscalParcela.bind(null, parcela.id)}>
                      <button
                        type="submit"
                        className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                      >
                        Marcar NF emitida
                      </button>
                    </form>
                  )}
                  <form action={excluirParcela.bind(null, parcela.id, honorario.id)}>
                    <button type="submit" className={`${classeBotaoPerigo} !px-3 !py-1 text-xs`}>
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={classeCard}>
        <p className="text-sm font-medium mb-3">Adicionar parcela</p>
        <ParcelaForm
          proximoNumero={honorario.parcelas.length + 1}
          action={criarParcela.bind(null, honorario.id)}
        />
      </div>
    </div>
  );
}
