import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarMoeda, formatarData, formatarCompetencia } from "@/lib/formatacao";
import {
  competenciaDeString,
  competenciaParaString,
  mesAdjacente,
  primeiroDiaMes,
} from "@/lib/financeiro";
import { ObrigacoesForm } from "@/components/obrigacoes-form";
import {
  salvarObrigacoesDaCompetencia,
  criarRetirada,
  excluirRetirada,
} from "@/lib/actions/obrigacoes";

export default async function ObrigacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string }>;
}) {
  const { competencia: competenciaTexto } = await searchParams;
  const competencia = competenciaTexto
    ? competenciaDeString(competenciaTexto)
    : primeiroDiaMes(new Date());
  const competenciaStr = competenciaParaString(competencia);
  const mesAnterior = competenciaParaString(mesAdjacente(competencia, -1));
  const proximoMes = competenciaParaString(mesAdjacente(competencia, 1));

  const [obrigacoesLista, retiradasTodas] = await Promise.all([
    prisma.obrigacaoSocietaria.findMany({ where: { competencia } }),
    prisma.retiradaLucro.findMany({ orderBy: { data: "desc" } }),
  ]);

  const obrigacoes = Object.fromEntries(
    obrigacoesLista.map((o) => [o.tipo, o])
  ) as Record<string, (typeof obrigacoesLista)[number]>;

  const retiradasDoMes = retiradasTodas.filter((r) => {
    const str = `${r.data.getUTCFullYear()}-${String(r.data.getUTCMonth() + 1).padStart(2, "0")}`;
    return str === competenciaStr;
  });
  const totalRetiradas = retiradasDoMes.reduce((soma, r) => soma + r.valor, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium capitalize">
          {formatarCompetencia(competencia)}
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/financeiro/obrigacoes?competencia=${mesAnterior}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ← Mês anterior
          </Link>
          <Link
            href={`/financeiro/obrigacoes?competencia=${proximoMes}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Próximo mês →
          </Link>
        </div>
      </div>

      <h3 className="text-base font-medium mb-3">Fechamento do mês</h3>
      <div className="mb-8">
        <ObrigacoesForm
          competenciaTexto={competenciaStr}
          obrigacoes={obrigacoes}
          action={salvarObrigacoesDaCompetencia}
        />
      </div>

      <h3 className="text-base font-medium mb-3">Retiradas de lucro</h3>
      {retiradasDoMes.length === 0 ? (
        <p className="text-gray-500 mb-4">Nenhuma retirada registrada neste mês.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {retiradasDoMes.map((retirada) => (
            <li
              key={retirada.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium">{formatarMoeda(retirada.valor)}</p>
                <p className="text-xs text-gray-500">
                  {formatarData(retirada.data)}
                  {retirada.observacoes && ` · ${retirada.observacoes}`}
                </p>
              </div>
              <form action={excluirRetirada.bind(null, retirada.id, competenciaStr)}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-gray-500 mb-4">
        Total de retiradas no mês:{" "}
        <span className="font-medium text-gray-900">{formatarMoeda(totalRetiradas)}</span>
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-4 max-w-md">
        <p className="text-sm font-medium mb-3">Nova retirada</p>
        <form action={criarRetirada} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="data">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={`${competenciaStr}-01`}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="valor">
                Valor (R$)
              </label>
              <input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min={0}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="observacoes">
              Observações
            </label>
            <input
              id="observacoes"
              name="observacoes"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adicionar retirada
          </button>
        </form>
      </div>
    </div>
  );
}
