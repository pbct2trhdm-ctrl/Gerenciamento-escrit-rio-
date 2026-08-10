import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_AREA, AREAS_PROCESSO, LABEL_STATUS_PROCESSO, formatarArea } from "@/lib/formatacao";
import { LABEL_TRIBUNAL, TODOS_TRIBUNAIS } from "@/lib/tribunais";
import type { Prisma } from "@/app/generated/prisma/client";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { FiltroComarcaVara } from "@/components/filtro-comarca-vara";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeTituloPagina,
} from "@/lib/estilos";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    area?: string;
    tribunal?: string;
    comarca?: string;
    vara?: string;
  }>;
}) {
  const { q, status, area, tribunal, comarca, vara } = await searchParams;

  const where: Prisma.ProcessoWhereInput = {};
  if (q) {
    where.OR = [
      { numeroProcesso: { contains: q } },
      { cliente: { nome: { contains: q } } },
      { comarca: { contains: q } },
      { vara: { contains: q } },
    ];
  }
  if (["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"].includes(status ?? "")) {
    where.status = status as Prisma.ProcessoWhereInput["status"];
  }
  if ((AREAS_PROCESSO as readonly string[]).includes(area ?? "")) {
    where.area = area as Prisma.ProcessoWhereInput["area"];
  }
  if (TODOS_TRIBUNAIS.includes(tribunal ?? "")) {
    where.tribunal = tribunal as Prisma.ProcessoWhereInput["tribunal"];
  }
  if (comarca) {
    where.comarca = comarca;
  }
  if (vara) {
    where.vara = vara;
  }

  const [processos, tribunaisEmUso, comarcaVaraEmUso] = await Promise.all([
    prisma.processo.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      include: { cliente: true },
    }),
    prisma.processo.findMany({
      where: { tribunal: { not: null } },
      distinct: ["tribunal"],
      select: { tribunal: true },
    }),
    prisma.processo.findMany({
      where: { OR: [{ comarca: { not: null } }, { vara: { not: null } }] },
      distinct: ["comarca", "vara"],
      select: { comarca: true, vara: true },
    }),
  ]);

  const opcoesTribunal = tribunaisEmUso
    .map((p) => p.tribunal)
    .filter((t): t is Exclude<typeof t, null> => t !== null)
    .sort((a, b) => LABEL_TRIBUNAL[a].localeCompare(LABEL_TRIBUNAL[b]));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={classeTituloPagina}>Processos</h1>
        <Link href="/processos/novo" className={classeBotaoPrimario}>
          Novo processo
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por número, cliente, comarca ou vara"
          defaultValue={q ?? ""}
          className={`${classeInputAuto} flex-1 min-w-[200px]`}
        />
        <select name="status" defaultValue={status ?? ""} className={classeInputAuto}>
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="SUSPENSO">Suspenso</option>
          <option value="ARQUIVADO">Arquivado</option>
          <option value="ENCERRADO">Encerrado</option>
        </select>
        <select name="area" defaultValue={area ?? ""} className={classeInputAuto}>
          <option value="">Todas as áreas</option>
          {AREAS_PROCESSO.map((codigo) => (
            <option key={codigo} value={codigo}>
              {LABEL_AREA[codigo]}
            </option>
          ))}
        </select>
        {opcoesTribunal.length > 0 && (
          <select name="tribunal" defaultValue={tribunal ?? ""} className={classeInputAuto}>
            <option value="">Todos os tribunais</option>
            {opcoesTribunal.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_TRIBUNAL[codigo]}
              </option>
            ))}
          </select>
        )}
        {comarcaVaraEmUso.length > 0 && (
          <FiltroComarcaVara
            pares={comarcaVaraEmUso}
            comarcaSelecionada={comarca ?? ""}
            varaSelecionada={vara ?? ""}
          />
        )}
        <button type="submit" className={classeBotaoSecundario}>
          Filtrar
        </button>
      </form>

      {processos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum processo encontrado."
          acaoHref="/processos/novo"
          acaoLabel="Adicionar o primeiro processo"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Tribunal</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((processo) => (
                <tr
                  key={processo.id}
                  className="border-b border-slate-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link href={`/processos/${processo.id}`} className="block px-4 py-3">
                      {processo.numeroProcesso ?? "Sem número"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">{processo.cliente.nome}</td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {formatarArea(processo.area, processo.areaOutraDescricao)}
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {processo.tribunal ? LABEL_TRIBUNAL[processo.tribunal] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tier={tierStatus(processo.status)}>
                      {LABEL_STATUS_PROCESSO[processo.status]}
                    </Badge>
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
