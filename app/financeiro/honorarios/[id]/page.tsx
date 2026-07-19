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
import { excluirHonorario } from "@/lib/actions/honorarios";
import {
  criarParcela,
  marcarParcelaPaga,
  marcarNotaFiscalParcela,
  excluirParcela,
} from "@/lib/actions/honorarios";
import { ParcelaForm } from "@/components/parcela-form";

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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold">
          {honorario.processo.cliente.nome} — {LABEL_TIPO_HONORARIO[honorario.tipo]}
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/financeiro/honorarios/${honorario.id}/editar`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Editar
          </Link>
          <form action={excluirHonorario.bind(null, honorario.id)}>
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-gray-500 mb-6">
        <Link href={`/processos/${honorario.processo.id}`} className="underline">
          {honorario.processo.numeroProcesso ?? "Processo sem número"}
        </Link>{" "}
        · Contrato em {formatarData(honorario.dataContrato)}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-gray-500">Valor total</p>
          <p>{honorario.valorTotal != null ? formatarMoeda(honorario.valorTotal) : "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">% de êxito</p>
          <p>{honorario.percentualExito != null ? `${honorario.percentualExito}%` : "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Observações</p>
          <p className="whitespace-pre-wrap">{honorario.observacoes || "—"}</p>
        </div>
      </div>

      <h3 className="text-lg font-medium mb-3">Parcelas</h3>

      {honorario.parcelas.length === 0 ? (
        <p className="text-gray-500 mb-6">Nenhuma parcela cadastrada.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {honorario.parcelas.map((parcela) => {
            const statusEfetivo = statusEfetivoParcela(parcela);
            const atrasada = statusEfetivo === "ATRASADO";
            return (
              <li
                key={parcela.id}
                className={`rounded-lg border p-4 ${
                  atrasada ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      Parcela {parcela.numero} — {formatarMoeda(parcela.valor)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Vencimento {formatarData(parcela.vencimento)}
                      {parcela.dataPagamento &&
                        ` · Pago em ${formatarData(parcela.dataPagamento)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${atrasada ? "text-red-700" : ""}`}>
                      {LABEL_STATUS_PARCELA[statusEfetivo]}
                    </p>
                    <p className="text-xs text-gray-400">
                      NF: {parcela.notaFiscalEmitida ? "emitida" : "pendente"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Link
                    href={`/financeiro/honorarios/${honorario.id}/parcelas/${parcela.id}/editar`}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Editar
                  </Link>
                  {parcela.status !== "PAGO" && (
                    <form action={marcarParcelaPaga.bind(null, parcela.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        Marcar como pago
                      </button>
                    </form>
                  )}
                  {!parcela.notaFiscalEmitida && (
                    <form action={marcarNotaFiscalParcela.bind(null, parcela.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-blue-300 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                      >
                        Marcar NF emitida
                      </button>
                    </form>
                  )}
                  <form action={excluirParcela.bind(null, parcela.id, honorario.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium mb-3">Adicionar parcela</p>
        <ParcelaForm
          proximoNumero={honorario.parcelas.length + 1}
          action={criarParcela.bind(null, honorario.id)}
        />
      </div>
    </div>
  );
}
