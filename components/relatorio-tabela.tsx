import { formatarMoeda } from "@/lib/formatacao";
import { calcularVariacao, type SecaoRelatorio, type LinhaRelatorio } from "@/lib/relatorio";
import { classeCard, classeTituloSecao } from "@/lib/estilos";

function VariacaoCelula({
  valor,
  valorAnterior,
  aumentoEhBom,
}: {
  valor: number;
  valorAnterior: number | null;
  aumentoEhBom: boolean;
}) {
  const variacao = calcularVariacao(valor, valorAnterior);
  if (!variacao) {
    return <td className="px-3 py-2 text-right text-texto-secundario">—</td>;
  }

  const { absoluta, percentual } = variacao;
  const aumentou = absoluta > 0;
  const reduziu = absoluta < 0;
  const favoravel = (aumentou && aumentoEhBom) || (reduziu && !aumentoEhBom);
  const cor = absoluta === 0 ? "text-texto-secundario" : favoravel ? "text-tranquilo" : "text-critico";
  const seta = aumentou ? "↑" : reduziu ? "↓" : "→";

  return (
    <td className={`px-3 py-2 text-right tabular-nums text-sm whitespace-nowrap ${cor}`}>
      {seta} {formatarMoeda(Math.abs(absoluta))}
      {percentual !== null && ` (${percentual >= 0 ? "+" : ""}${percentual.toFixed(1)}%)`}
    </td>
  );
}

function LinhaTabela({
  linha,
  comparar,
  aumentoEhBom,
  destaque,
}: {
  linha: LinhaRelatorio;
  comparar: boolean;
  aumentoEhBom: boolean;
  destaque?: boolean;
}) {
  return (
    <tr className={destaque ? "font-semibold border-t border-slate-200" : ""}>
      <td className="px-3 py-2">{linha.label}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatarMoeda(linha.valor)}</td>
      {comparar && (
        <>
          <td className="px-3 py-2 text-right tabular-nums text-texto-secundario">
            {linha.valorAnterior !== null ? formatarMoeda(linha.valorAnterior) : "—"}
          </td>
          <VariacaoCelula
            valor={linha.valor}
            valorAnterior={linha.valorAnterior}
            aumentoEhBom={aumentoEhBom}
          />
        </>
      )}
    </tr>
  );
}

export function SecaoTabela({ secao, comparar }: { secao: SecaoRelatorio; comparar: boolean }) {
  return (
    <div>
      <h2 className={`${classeTituloSecao} mb-3`}>{secao.titulo}</h2>
      <div className={`overflow-x-auto ${classeCard} !p-0`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-texto-secundario">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium text-right">Valor</th>
              {comparar && (
                <>
                  <th className="px-3 py-2 font-medium text-right whitespace-nowrap">
                    Período anterior
                  </th>
                  <th className="px-3 py-2 font-medium text-right">Variação</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {secao.linhas.map((linhaItem) => (
              <LinhaTabela
                key={linhaItem.label}
                linha={linhaItem}
                comparar={comparar}
                aumentoEhBom={secao.aumentoEhBom}
              />
            ))}
            <LinhaTabela
              linha={secao.subtotal}
              comparar={comparar}
              aumentoEhBom={secao.aumentoEhBom}
              destaque
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CartaoSaldo({ linha, comparar }: { linha: LinhaRelatorio; comparar: boolean }) {
  const variacao = comparar ? calcularVariacao(linha.valor, linha.valorAnterior) : null;

  return (
    <div className={`${classeCard} flex flex-wrap items-center justify-between gap-4`}>
      <div>
        <p className="text-sm text-texto-secundario">{linha.label}</p>
        <p
          className={`text-2xl font-semibold tabular-nums ${
            linha.valor < 0 ? "text-critico" : "text-texto-principal"
          }`}
        >
          {formatarMoeda(linha.valor)}
        </p>
      </div>
      {comparar && linha.valorAnterior !== null && (
        <div className="text-right text-sm">
          <p className="text-texto-secundario">
            Período anterior:{" "}
            <span className="tabular-nums">{formatarMoeda(linha.valorAnterior)}</span>
          </p>
          {variacao && (
            <p className={variacao.absoluta >= 0 ? "text-tranquilo" : "text-critico"}>
              {variacao.absoluta >= 0 ? "↑" : "↓"} {formatarMoeda(Math.abs(variacao.absoluta))}
              {variacao.percentual !== null &&
                ` (${variacao.percentual >= 0 ? "+" : ""}${variacao.percentual.toFixed(1)}%)`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
