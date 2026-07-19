import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_PRAZO,
  LABEL_STATUS_PRAZO,
  formatarData,
} from "@/lib/formatacao";
import { diasRestantes } from "@/lib/prazos";
import { marcarPrazoComoCumprido } from "@/lib/actions/prazos";
import type { Prisma } from "@/app/generated/prisma/client";

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
      include: { processo: { include: { cliente: true } } },
    }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: { id: true, numeroProcesso: true },
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Prazos/Agenda</h1>
        <Link
          href="/prazos/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo prazo
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CUMPRIDO">Cumprido</option>
          <option value="PERDIDO">Perdido</option>
        </select>
        <select
          name="processoId"
          defaultValue={processoId ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os processos</option>
          {processos.map((processo) => (
            <option key={processo.id} value={processo.id}>
              {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Filtrar
        </button>
      </form>

      {prazos.length === 0 ? (
        <p className="text-gray-500">Nenhum prazo encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const urgente = prazo.status === "PENDENTE" && restantes <= 7;
            return (
              <li key={prazo.id}>
                <div
                  className={`rounded-lg border p-4 ${
                    urgente
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/processos/${prazo.processoId}`}
                        className="font-medium hover:underline"
                      >
                        {prazo.processo.cliente.nome} ·{" "}
                        {prazo.processo.numeroProcesso ?? "Sem número"}
                      </Link>
                      <p className="text-sm text-gray-500">
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
                      <p className="text-sm text-gray-500">
                        {LABEL_STATUS_PRAZO[prazo.status]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/prazos/${prazo.id}/editar`}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    {prazo.status === "PENDENTE" && (
                      <form action={marcarPrazoComoCumprido.bind(null, prazo.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
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
