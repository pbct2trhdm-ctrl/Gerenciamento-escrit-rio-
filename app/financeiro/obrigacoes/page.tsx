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
import {
  classeInput,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeCard,
  classeLabel,
  classeTituloSecao,
} from "@/lib/estilos";

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
        <h2 className={`${classeTituloSecao} capitalize`}>{formatarCompetencia(competencia)}</h2>
        <div className="flex gap-2">
          <Link
            href={`/financeiro/obrigacoes?competencia=${mesAnterior}`}
            className={classeBotaoSecundario}
          >
            ← Mês anterior
          </Link>
          <Link
            href={`/financeiro/obrigacoes?competencia=${proximoMes}`}
            className={classeBotaoSecundario}
          >
            Próximo mês →
          </Link>
        </div>
      </div>

      <h3 className={`${classeTituloSecao} !text-base mb-3`}>Fechamento do mês</h3>
      <div className="mb-8">
        <ObrigacoesForm
          competenciaTexto={competenciaStr}
          obrigacoes={obrigacoes}
          action={salvarObrigacoesDaCompetencia}
        />
      </div>

      <h3 className={`${classeTituloSecao} !text-base mb-3`}>Retiradas de lucro</h3>
      {retiradasDoMes.length === 0 ? (
        <p className="text-texto-secundario mb-4 text-sm">Nenhuma retirada registrada neste mês.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {retiradasDoMes.map((retirada) => (
            <li
              key={retirada.id}
              className={`flex items-center justify-between ${classeCard}`}
            >
              <div>
                <p className="text-sm font-medium tabular-nums">
                  {formatarMoeda(retirada.valor)}
                </p>
                <p className="text-xs text-texto-secundario tabular-nums">
                  {formatarData(retirada.data)}
                  {retirada.observacoes && ` · ${retirada.observacoes}`}
                </p>
              </div>
              <form action={excluirRetirada.bind(null, retirada.id, competenciaStr)}>
                <button type="submit" className={`${classeBotaoPerigo} !px-3 !py-1 text-xs`}>
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-texto-secundario mb-4">
        Total de retiradas no mês:{" "}
        <span className="font-medium tabular-nums text-texto-principal">
          {formatarMoeda(totalRetiradas)}
        </span>
      </p>

      <div className={`${classeCard} max-w-md`}>
        <p className="text-sm font-medium mb-3">Nova retirada</p>
        <form action={criarRetirada} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={classeLabel} htmlFor="data">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={`${competenciaStr}-01`}
                className={classeInput}
              />
            </div>
            <div>
              <label className={classeLabel} htmlFor="valor">
                Valor (R$)
              </label>
              <input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min={0}
                required
                className={classeInput}
              />
            </div>
          </div>
          <div>
            <label className={classeLabel} htmlFor="observacoes">
              Observações
            </label>
            <input id="observacoes" name="observacoes" className={classeInput} />
          </div>
          <button type="submit" className={classeBotaoPrimario}>
            Adicionar retirada
          </button>
        </form>
      </div>
    </div>
  );
}
