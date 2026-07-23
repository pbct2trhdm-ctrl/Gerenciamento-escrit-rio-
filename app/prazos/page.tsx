import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_PRAZO,
  LABEL_STATUS_PRAZO,
  LABEL_MODALIDADE_AUDIENCIA,
  formatarData,
  formatarDataHorario,
} from "@/lib/formatacao";
import { diasRestantes } from "@/lib/prazos";
import { marcarPrazoComoCumprido } from "@/lib/actions/prazos";
import type { Prisma } from "@/app/generated/prisma/client";
import { tierPrazo, CLASSE_BADGE_AUDIENCIA } from "@/lib/urgencia";
import { SeloPrazo } from "@/components/selo-prazo";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoConfirma,
  classeTituloPagina,
} from "@/lib/estilos";

export default async function PrazosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; processoId?: string }>;
}) {
  const { status, processoId } = await searchParams;

  const where: Prisma.PrazoWhereInput = {};
  if (["PENDENTE", "CUMPRIDO", "PERDIDO"].includes(status ?? "")) {
    where.status = status as Prisma.PrazoWhereInput["status"];
  }
  if (processoId) {
    where.processoId = processoId;
  }

  const [prazos, processos] = await Promise.all([
    prisma.prazo.findMany({
      where,
      orderBy: { dataFinal: "asc" },
      include: {
        processo: { include: { cliente: true } },
        origemAndamento: { select: { data: true } },
      },
    }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: { id: true, numeroProcesso: true },
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={classeTituloPagina}>Prazos/Agenda</h1>
        <Link href="/prazos/novo" className={classeBotaoPrimario}>
          Novo prazo
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select name="status" defaultValue={status ?? ""} className={classeInputAuto}>
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CUMPRIDO">Cumprido</option>
          <option value="PERDIDO">Perdido</option>
        </select>
        <select
          name="processoId"
          defaultValue={processoId ?? ""}
          className={classeInputAuto}
        >
          <option value="">Todos os processos</option>
          {processos.map((processo) => (
            <option key={processo.id} value={processo.id}>
              {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <button type="submit" className={classeBotaoSecundario}>
          Filtrar
        </button>
      </form>

      {prazos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum prazo encontrado."
          acaoHref="/prazos/novo"
          acaoLabel="Adicionar o primeiro prazo"
        />
      ) : (
        <ul className="space-y-3">
          {prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const tier = tierPrazo(prazo.status, restantes);
            const ehAudiencia = prazo.tipo === "AUDIENCIA";
            return (
              <li key={prazo.id}>
                <div
                  className={`rounded-xl border bg-superficie p-4 shadow-xs ${
                    ehAudiencia && prazo.status === "PENDENTE"
                      ? "border-audiencia/40"
                      : tier === "critico" && prazo.status === "PENDENTE"
                        ? "border-critico/30"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <SeloPrazo id={prazo.id} dias={restantes} tier={tier} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/processos/${prazo.processoId}`}
                          className="font-medium hover:underline"
                        >
                          {prazo.processo.cliente.nome} ·{" "}
                          {prazo.processo.numeroProcesso ?? "Sem número"}
                        </Link>
                        {ehAudiencia && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${CLASSE_BADGE_AUDIENCIA}`}
                          >
                            Audiência
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-texto-secundario">
                        {LABEL_TIPO_PRAZO[prazo.tipo]}
                      </p>
                      {ehAudiencia && prazo.modalidadeAudiencia && (
                        <p className="text-sm text-texto-secundario">
                          {LABEL_MODALIDADE_AUDIENCIA[prazo.modalidadeAudiencia]}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums">
                        {ehAudiencia
                          ? formatarDataHorario(prazo.dataFinal)
                          : formatarData(prazo.dataFinal)}
                      </p>
                      <div className="mt-1">
                        <Badge tier={tier}>{LABEL_STATUS_PRAZO[prazo.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  {ehAudiencia && (prazo.linkAudiencia || prazo.contatoVaraAudiencia) && (
                    <div className="mt-3 text-sm space-y-1">
                      {prazo.linkAudiencia && (
                        <p>
                          <span className="text-texto-secundario">Link: </span>
                          <a
                            href={prazo.linkAudiencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline break-all"
                          >
                            {prazo.linkAudiencia}
                          </a>
                        </p>
                      )}
                      {prazo.contatoVaraAudiencia && (
                        <p>
                          <span className="text-texto-secundario">
                            Contato da vara (solicitar link):{" "}
                          </span>
                          {prazo.contatoVaraAudiencia}
                        </p>
                      )}
                    </div>
                  )}
                  {prazo.origemAndamento && (
                    <p className="mt-2 text-xs text-texto-secundario italic">
                      Gerado a partir de andamento de {formatarData(prazo.origemAndamento.data)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/prazos/${prazo.id}/editar`}
                      className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                    >
                      Editar
                    </Link>
                    {prazo.status === "PENDENTE" && (
                      <form action={marcarPrazoComoCumprido.bind(null, prazo.id)}>
                        <button
                          type="submit"
                          className={`${classeBotaoConfirma} !px-3 !py-1 text-xs`}
                        >
                          Marcar como cumprido
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
