import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_SUCUMBENCIA,
  formatarMoeda,
  formatarData,
} from "@/lib/formatacao";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { classeBotaoPrimario, classeTituloSecao } from "@/lib/estilos";

export default async function SucumbenciaPage() {
  const sucumbencias = await prisma.honorarioSucumbencial.findMany({
    orderBy: { criadoEm: "desc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={classeTituloSecao}>Honorários de sucumbência</h2>
        <Link href="/financeiro/sucumbencia/novo" className={classeBotaoPrimario}>
          Nova sucumbência
        </Link>
      </div>

      {sucumbencias.length === 0 ? (
        <EmptyState
          mensagem="Nenhum registro cadastrado."
          acaoHref="/financeiro/sucumbencia/novo"
          acaoLabel="Adicionar a primeira sucumbência"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recebimento</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {sucumbencias.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link href={`/financeiro/sucumbencia/${s.id}/editar`} className="block px-4 py-3">
                      {s.processo.cliente.nome}
                      <span className="block text-xs text-texto-secundario font-normal">
                        {s.processo.numeroProcesso ?? "Sem número"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tier={tierStatus(s.status)}>
                      {LABEL_STATUS_SUCUMBENCIA[s.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario tabular-nums">
                    {s.dataRecebimento ? formatarData(s.dataRecebimento) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {s.valorDefinido != null
                      ? formatarMoeda(s.valorDefinido)
                      : s.valorEstimado != null
                        ? `~ ${formatarMoeda(s.valorEstimado)}`
                        : s.percentual != null
                          ? `${s.percentual}%`
                          : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
