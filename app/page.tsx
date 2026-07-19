import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { LABEL_TIPO_PRAZO, formatarData } from "@/lib/formatacao";
import { tierPorDiasRestantes, TIER_CLASSES } from "@/lib/urgencia";
import { SeloPrazo } from "@/components/selo-prazo";
import { EmptyState } from "@/components/empty-state";
import { classeTituloPagina } from "@/lib/estilos";

export default async function DashboardPage() {
  const prazos = await prisma.prazo.findMany({
    where: { status: "PENDENTE" },
    orderBy: { dataFinal: "asc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div className="max-w-4xl">
      <h1 className={classeTituloPagina}>Dashboard</h1>
      <p className="text-texto-secundario mb-6">
        Prazos pendentes mais próximos de vencer
      </p>

      {prazos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum prazo pendente cadastrado."
          acaoHref="/prazos/novo"
          acaoLabel="Adicionar o primeiro prazo"
        />
      ) : (
        <ul className="space-y-3">
          {prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const tier = tierPorDiasRestantes(restantes);
            return (
              <li key={prazo.id}>
                <Link
                  href={`/processos/${prazo.processoId}`}
                  className={`flex items-center gap-4 rounded-lg border bg-superficie p-4 transition-colors hover:bg-fundo ${
                    tier === "critico" ? "border-critico/30" : "border-gray-200"
                  }`}
                >
                  <SeloPrazo id={prazo.id} dias={restantes} tier={tier} size={72} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {prazo.processo.cliente.nome}
                    </p>
                    <p className="text-sm text-texto-secundario truncate">
                      {prazo.processo.numeroProcesso ?? "Sem número"} ·{" "}
                      {LABEL_TIPO_PRAZO[prazo.tipo]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">
                      {formatarData(prazo.dataFinal)}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_CLASSES[tier]}`}
                    >
                      {restantes < 0
                        ? `${Math.abs(restantes)} dia(s) em atraso`
                        : restantes === 0
                          ? "Vence hoje"
                          : `${restantes} dia(s) restante(s)`}
                    </span>
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
