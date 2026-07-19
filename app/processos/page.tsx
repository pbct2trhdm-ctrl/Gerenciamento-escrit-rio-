import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_AREA, LABEL_STATUS_PROCESSO } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; area?: string }>;
}) {
  const { q, status, area } = await searchParams;

  const where: Prisma.ProcessoWhereInput = {};
  if (q) {
    where.OR = [
      { numeroProcesso: { contains: q } },
      { cliente: { nome: { contains: q } } },
    ];
  }
  if (["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"].includes(status ?? "")) {
    where.status = status as Prisma.ProcessoWhereInput["status"];
  }
  if (["CIVEL", "PREVIDENCIARIO", "TRIBUTARIO", "OUTRO"].includes(area ?? "")) {
    where.area = area as Prisma.ProcessoWhereInput["area"];
  }

  const processos = await prisma.processo.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: { cliente: true },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Processos</h1>
        <Link
          href="/processos/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo processo
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por número ou cliente"
          defaultValue={q ?? ""}
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="SUSPENSO">Suspenso</option>
          <option value="ARQUIVADO">Arquivado</option>
          <option value="ENCERRADO">Encerrado</option>
        </select>
        <select
          name="area"
          defaultValue={area ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todas as áreas</option>
          <option value="CIVEL">Cível</option>
          <option value="PREVIDENCIARIO">Previdenciário</option>
          <option value="TRIBUTARIO">Tributário</option>
          <option value="OUTRO">Outro</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Filtrar
        </button>
      </form>

      {processos.length === 0 ? (
        <p className="text-gray-500">Nenhum processo encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {processos.map((processo) => (
            <li key={processo.id}>
              <Link
                href={`/processos/${processo.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {processo.numeroProcesso ?? "Sem número"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {processo.cliente.nome} · {LABEL_AREA[processo.area]}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {LABEL_STATUS_PROCESSO[processo.status]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
