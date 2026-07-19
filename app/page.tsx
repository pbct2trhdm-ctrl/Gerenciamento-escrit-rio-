import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { LABEL_TIPO_PRAZO, formatarData } from "@/lib/formatacao";

export default async function DashboardPage() {
  const prazos = await prisma.prazo.findMany({
    where: { status: "PENDENTE" },
    orderBy: { dataFinal: "asc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Prazos pendentes mais próximos de vencer
      </p>

      {prazos.length === 0 ? (
        <p className="text-gray-500">Nenhum prazo pendente cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const urgente = restantes <= 7;
            return (
              <li key={prazo.id}>
                <Link
                  href={`/processos/${prazo.processoId}`}
                  className={`block rounded-lg border p-4 transition-colors ${
                    urgente
                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {prazo.processo.cliente.nome}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {prazo.processo.numeroProcesso ?? "Sem número"} ·{" "}
                        {LABEL_TIPO_PRAZO[prazo.tipo]}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold ${
                          urgente ? "text-red-700" : "text-gray-900"
                        }`}
                      >
                        {formatarData(prazo.dataFinal)}
                      </p>
                      <p
                        className={`text-sm ${
                          urgente ? "text-red-600" : "text-gray-500"
                        }`}
                      >
                        {restantes < 0
                          ? `${Math.abs(restantes)} dia(s) em atraso`
                          : restantes === 0
                            ? "Vence hoje"
                            : `${restantes} dia(s) restante(s)`}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
