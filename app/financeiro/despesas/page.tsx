import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_CATEGORIA_DESPESA, formatarMoeda, formatarData } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";
import { EmptyState } from "@/components/empty-state";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeTituloSecao,
} from "@/lib/estilos";

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
        <h2 className={classeTituloSecao}>Despesas</h2>
        <Link href="/financeiro/despesas/novo" className={classeBotaoPrimario}>
          Nova despesa
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className={classeInputAuto}
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

      <p className="text-sm text-texto-secundario mb-3">
        Total filtrado:{" "}
        <span className="font-medium tabular-nums text-texto-principal">
          {formatarMoeda(total)}
        </span>
      </p>

      {despesas.length === 0 ? (
        <EmptyState
          mensagem="Nenhuma despesa encontrada."
          acaoHref="/financeiro/despesas/novo"
          acaoLabel="Adicionar a primeira despesa"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((despesa) => (
                <tr
                  key={despesa.id}
                  className="border-b border-gray-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link
                      href={`/financeiro/despesas/${despesa.id}/editar`}
                      className="block px-4 py-3"
                    >
                      {despesa.descricao}
                      {despesa.processo && (
                        <span className="block text-xs text-texto-secundario font-normal">
                          {despesa.processo.cliente.nome}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {LABEL_CATEGORIA_DESPESA[despesa.categoria]}
                  </td>
                  <td className="px-4 py-3 text-texto-secundario tabular-nums">
                    {formatarData(despesa.data)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatarMoeda(despesa.valor)}
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
