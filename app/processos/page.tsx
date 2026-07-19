import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_AREA, LABEL_STATUS_PROCESSO } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeTituloPagina,
} from "@/lib/estilos";

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
        <h1 className={classeTituloPagina}>Processos</h1>
        <Link href="/processos/novo" className={classeBotaoPrimario}>
          Novo processo
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por número ou cliente"
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
          <option value="CIVEL">Cível</option>
          <option value="PREVIDENCIARIO">Previdenciário</option>
          <option value="TRIBUTARIO">Tributário</option>
          <option value="OUTRO">Outro</option>
        </select>
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((processo) => (
                <tr
                  key={processo.id}
                  className="border-b border-gray-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link href={`/processos/${processo.id}`} className="block px-4 py-3">
                      {processo.numeroProcesso ?? "Sem número"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">{processo.cliente.nome}</td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {LABEL_AREA[processo.area]}
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
