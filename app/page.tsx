import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import {
  LABEL_TIPO_PRAZO,
  LABEL_MODALIDADE_AUDIENCIA,
  formatarData,
  formatarDataHorario,
} from "@/lib/formatacao";
import { tierPorDiasRestantes, TIER_CLASSES, CLASSE_BADGE_AUDIENCIA } from "@/lib/urgencia";
import { SeloPrazo } from "@/components/selo-prazo";
import { EmptyState } from "@/components/empty-state";
import { classeTituloPagina } from "@/lib/estilos";

export default async function DashboardPage() {
  const prazos = await prisma.prazo.findMany({
    where: { status: "PENDENTE" },
    orderBy: { dataFinal: "asc" },
    include: {
      processo: { include: { cliente: true } },
      origemAndamento: { select: { data: true } },
    },
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
            const ehAudiencia = prazo.tipo === "AUDIENCIA";
            const varaComarca = [prazo.processo.vara, prazo.processo.comarca]
              .filter(Boolean)
              .join(" — ");
            const bordaUrgencia = ehAudiencia
              ? "border-audiencia/40 hover:border-audiencia/70"
              : tier === "critico"
                ? "border-critico/30 hover:border-critico/60"
                : tier === "atencao"
                  ? "border-atencao/30 hover:border-atencao/60"
                  : "border-tranquilo/30 hover:border-tranquilo/60";
            return (
              <li key={prazo.id}>
                <div
                  className={`flex items-center gap-5 rounded-xl border bg-superficie p-4 shadow-xs transition-all ${bordaUrgencia}`}
                >
                  <SeloPrazo id={prazo.id} dias={restantes} tier={tier} size={72} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-texto-principal truncate">
                        {LABEL_TIPO_PRAZO[prazo.tipo]}
                      </p>
                      {ehAudiencia && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${CLASSE_BADGE_AUDIENCIA}`}
                        >
                          Audiência
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-texto-secundario font-mono truncate mb-1">
                      Proc. nº {prazo.processo.numeroProcesso ?? "não informado"}
                      {varaComarca && (
                        <span className="font-sans"> • {varaComarca}</span>
                      )}
                    </p>
                    <p className="text-xs text-texto-secundario truncate">
                      <span className="font-medium text-texto-principal">
                        {prazo.processo.cliente.nome}
                      </span>{" "}
                      · {ehAudiencia ? formatarDataHorario(prazo.dataFinal) : formatarData(prazo.dataFinal)}
                      {ehAudiencia && prazo.modalidadeAudiencia && (
                        <> · {LABEL_MODALIDADE_AUDIENCIA[prazo.modalidadeAudiencia]}</>
                      )}
                    </p>
                    {prazo.origemAndamento && (
                      <p className="text-xs text-texto-secundario italic truncate">
                        Gerado a partir de andamento de {formatarData(prazo.origemAndamento.data)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_CLASSES[tier]}`}
                    >
                      {restantes < 0
                        ? `${Math.abs(restantes)} dia(s) em atraso`
                        : restantes === 0
                          ? "Vence hoje"
                          : `${restantes} dia(s) restante(s)`}
                    </span>
                    <Link
                      href={`/processos/${prazo.processoId}`}
                      className="inline-flex items-center rounded-md bg-base-escura px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Ver processo →
                    </Link>
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
