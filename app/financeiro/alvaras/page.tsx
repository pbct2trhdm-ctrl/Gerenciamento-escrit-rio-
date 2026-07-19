import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_STATUS_ALVARA, formatarMoeda, formatarData } from "@/lib/formatacao";
import { diasDesde, DIAS_ALERTA_ALVARA } from "@/lib/financeiro";
import { marcarAlvaraRepassado } from "@/lib/actions/alvaras";

export default async function AlvarasPage() {
  const alvaras = await prisma.alvara.findMany({
    orderBy: { criadoEm: "desc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Alvarás</h2>
        <Link
          href="/financeiro/alvaras/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo alvará
        </Link>
      </div>

      {alvaras.length === 0 ? (
        <p className="text-gray-500">Nenhum alvará cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {alvaras.map((alvara) => {
            const pendenteHaMuitoTempo =
              alvara.status === "AGUARDANDO_REPASSE" &&
              alvara.dataRecebimento &&
              diasDesde(alvara.dataRecebimento) > DIAS_ALERTA_ALVARA;
            return (
              <li key={alvara.id}>
                <div
                  className={`rounded-lg border p-4 ${
                    pendenteHaMuitoTempo
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{alvara.processo.cliente.nome}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {alvara.processo.numeroProcesso ?? "Sem número"}
                        {alvara.dataRecebimento &&
                          ` · recebido em ${formatarData(alvara.dataRecebimento)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatarMoeda(alvara.valorTotal)}</p>
                      <p className="text-sm text-gray-500">
                        Repassar: {formatarMoeda(alvara.valorRepassado)}
                      </p>
                      <p
                        className={`text-sm ${
                          pendenteHaMuitoTempo ? "text-red-700 font-medium" : "text-gray-500"
                        }`}
                      >
                        {LABEL_STATUS_ALVARA[alvara.status]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/financeiro/alvaras/${alvara.id}/editar`}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    {alvara.status !== "REPASSADO" && (
                      <form action={marcarAlvaraRepassado.bind(null, alvara.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          Marcar como repassado
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
