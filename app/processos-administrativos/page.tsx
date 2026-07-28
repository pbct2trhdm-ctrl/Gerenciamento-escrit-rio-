import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import {
  LABEL_ORGAO_PROCESSO_ADMINISTRATIVO,
  LABEL_TIPO_PROCESSO_ADMINISTRATIVO,
  LABEL_STATUS_PROCESSO_ADMINISTRATIVO,
  STATUS_PROCESSO_ADMINISTRATIVO,
  formatarData,
} from "@/lib/formatacao";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBadgeNeutro,
  classeTituloPagina,
} from "@/lib/estilos";

export default async function ProcessosAdministrativosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; orgao?: string; status?: string }>;
}) {
  const { q, orgao, status } = await searchParams;
  const orgaoAtivo = orgao === "INSS" || orgao === "RECEITA_FEDERAL" ? orgao : "";
  const statusAtivo = (STATUS_PROCESSO_ADMINISTRATIVO as readonly string[]).includes(status ?? "")
    ? status!
    : "";

  const whereBase: Prisma.ProcessoAdministrativoWhereInput = {
    ...(q
      ? {
          OR: [
            { cliente: { nome: { contains: q } } },
            { numeroProtocolo: { contains: q } },
          ],
        }
      : {}),
    ...(statusAtivo ? { status: statusAtivo as Prisma.ProcessoAdministrativoWhereInput["status"] } : {}),
  };

  const whereListagem: Prisma.ProcessoAdministrativoWhereInput = orgaoAtivo
    ? { ...whereBase, orgao: orgaoAtivo }
    : whereBase;

  const [totalTodos, totalInss, totalReceita, processos] = await Promise.all([
    prisma.processoAdministrativo.count({ where: whereBase }),
    prisma.processoAdministrativo.count({ where: { ...whereBase, orgao: "INSS" } }),
    prisma.processoAdministrativo.count({ where: { ...whereBase, orgao: "RECEITA_FEDERAL" } }),
    prisma.processoAdministrativo.findMany({
      where: whereListagem,
      orderBy: { dataAbertura: "desc" },
      include: { cliente: true },
    }),
  ]);

  const segmentos = [
    { valor: "", label: "Todos", contagem: totalTodos },
    { valor: "INSS", label: "INSS", contagem: totalInss },
    { valor: "RECEITA_FEDERAL", label: "Receita Federal", contagem: totalReceita },
  ] as const;

  function hrefSegmento(valor: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusAtivo) params.set("status", statusAtivo);
    if (valor) params.set("orgao", valor);
    const query = params.toString();
    return `/processos-administrativos${query ? `?${query}` : ""}`;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={classeTituloPagina}>Processos Administrativos</h1>
        <Link href="/processos-administrativos/novo" className={classeBotaoPrimario}>
          Novo processo administrativo
        </Link>
      </div>

      <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-superficie p-1 mb-4">
        {segmentos.map((segmento) => {
          const ativo = segmento.valor === orgaoAtivo;
          return (
            <Link
              key={segmento.valor || "todos"}
              href={hrefSegmento(segmento.valor)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-base-escura text-white"
                  : "text-texto-secundario hover:bg-fundo hover:text-texto-principal"
              }`}
            >
              {segmento.label} ({segmento.contagem})
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por cliente ou protocolo"
          defaultValue={q ?? ""}
          className={`${classeInputAuto} flex-1`}
        />
        <select name="status" defaultValue={statusAtivo} className={classeInputAuto}>
          <option value="">Todos os status</option>
          {STATUS_PROCESSO_ADMINISTRATIVO.map((codigo) => (
            <option key={codigo} value={codigo}>
              {LABEL_STATUS_PROCESSO_ADMINISTRATIVO[codigo]}
            </option>
          ))}
        </select>
        <input type="hidden" name="orgao" value={orgaoAtivo} />
        <button type="submit" className={classeBotaoSecundario}>
          Buscar
        </button>
      </form>

      {processos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum processo administrativo encontrado."
          acaoHref="/processos-administrativos/novo"
          acaoLabel="Adicionar o primeiro processo administrativo"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Órgão</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Protocolo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Abertura</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((processo) => (
                <tr
                  key={processo.id}
                  className="border-b border-slate-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link
                      href={`/processos-administrativos/${processo.id}`}
                      className="block px-4 py-3"
                    >
                      {processo.cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={classeBadgeNeutro}>
                      {LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {LABEL_TIPO_PROCESSO_ADMINISTRATIVO[processo.tipo]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-texto-secundario">
                    {processo.numeroProtocolo || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tier={tierStatus(processo.status)}>
                      {LABEL_STATUS_PROCESSO_ADMINISTRATIVO[processo.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-texto-secundario">
                    {formatarData(processo.dataAbertura)}
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
