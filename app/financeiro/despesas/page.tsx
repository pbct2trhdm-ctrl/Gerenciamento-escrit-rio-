import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_CATEGORIA_DESPESA, formatarMoeda, formatarData } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; processoId?: string }>;
}) {
  const { categoria, processoId } = await searchParams;

  const where: Prisma.DespesaWhereInput = {};
  if (["CUSTAS", "ALUGUEL", "MATERIAL", "OUTRO"].includes(categoria ?? "")) {
    where.categoria = categoria as Prisma.DespesaWhereInput["categoria"];
  }
  if (processoId) {
    where.processoId = processoId;
  }

  const [despesas, processos] = await Promise.all([
    prisma.despesa.findMany({
      where,
      orderBy: { data: "desc" },
      include: { processo: { include: { cliente: true } } },
    }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: { id: true, numeroProcesso: true },
    }),
  ]);

  const total = despesas.reduce((soma, d) => soma + d.valor, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Despesas</h2>
        <Link
          href="/financeiro/despesas/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova despesa
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todas as categorias</option>
          <option value="CUSTAS">Custas</option>
          <option value="ALUGUEL">Aluguel</option>
          <option value="MATERIAL">Material</option>
          <option value="OUTRO">Outro</option>
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

      <p className="text-sm text-gray-500 mb-3">
        Total filtrado: <span className="font-medium">{formatarMoeda(total)}</span>
      </p>

      {despesas.length === 0 ? (
        <p className="text-gray-500">Nenhuma despesa encontrada.</p>
      ) : (
        <ul className="space-y-2">
          {despesas.map((despesa) => (
            <li key={despesa.id}>
              <Link
                href={`/financeiro/despesas/${despesa.id}/editar`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{despesa.descricao}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {LABEL_CATEGORIA_DESPESA[despesa.categoria]}
                      {despesa.processo && ` · ${despesa.processo.cliente.nome}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatarMoeda(despesa.valor)}</p>
                    <p className="text-sm text-gray-500">{formatarData(despesa.data)}</p>
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
