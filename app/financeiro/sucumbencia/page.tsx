import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_SUCUMBENCIA,
  formatarMoeda,
  formatarData,
} from "@/lib/formatacao";

export default async function SucumbenciaPage() {
  const sucumbencias = await prisma.honorarioSucumbencial.findMany({
    orderBy: { criadoEm: "desc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Honorários de sucumbência</h2>
        <Link
          href="/financeiro/sucumbencia/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova sucumbência
        </Link>
      </div>

      {sucumbencias.length === 0 ? (
        <p className="text-gray-500">Nenhum registro cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {sucumbencias.map((s) => (
            <li key={s.id}>
              <Link
                href={`/financeiro/sucumbencia/${s.id}/editar`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.processo.cliente.nome}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {s.processo.numeroProcesso ?? "Sem número"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">
                      {s.valorDefinido != null
                        ? formatarMoeda(s.valorDefinido)
                        : s.valorEstimado != null
                          ? `~ ${formatarMoeda(s.valorEstimado)}`
                          : s.percentual != null
                            ? `${s.percentual}%`
                            : "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {LABEL_STATUS_SUCUMBENCIA[s.status]}
                      {s.dataRecebimento && ` · ${formatarData(s.dataRecebimento)}`}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
