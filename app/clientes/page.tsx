import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ordenarPorNome } from "@/lib/ordenacao";
import type { Prisma } from "@/app/generated/prisma/client";
import { EmptyState } from "@/components/empty-state";
import { ProximoPrazo } from "@/components/proximo-prazo";

/** Link do WhatsApp só para celular (DDD + 9 dígitos); fixo não costuma ter WhatsApp. */
function linkWhatsapp(telefone: string | null): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "").replace(/^55(?=\d{11}$)/, "");
  return digitos.length === 11 && digitos[2] === "9" ? `https://wa.me/55${digitos}` : null;
}
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBadgeNeutro,
  classeTituloPagina,
} from "@/lib/estilos";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q, tipo } = await searchParams;
  const tipoAtivo = tipo === "PF" || tipo === "PJ" ? tipo : "";

  const whereBusca: Prisma.ClienteWhereInput = q
    ? { OR: [{ nome: { contains: q } }, { cpfCnpj: { contains: q } }] }
    : {};

  const whereListagem: Prisma.ClienteWhereInput = tipoAtivo
    ? { ...whereBusca, tipo: tipoAtivo }
    : whereBusca;

  const [totalTodos, totalPF, totalPJ, clientes] = await Promise.all([
    prisma.cliente.count({ where: whereBusca }),
    prisma.cliente.count({ where: { ...whereBusca, tipo: "PF" } }),
    prisma.cliente.count({ where: { ...whereBusca, tipo: "PJ" } }),
    prisma.cliente
      .findMany({
        where: whereListagem,
        orderBy: { nome: "asc" },
        include: {
          processos: {
            where: { status: { in: ["ATIVO", "SUSPENSO"] } },
            select: {
              prazos: {
                where: { status: "PENDENTE" },
                orderBy: { dataFinal: "asc" },
                take: 1,
                select: { id: true, dataFinal: true, tipo: true },
              },
            },
          },
          _count: { select: { processosAdministrativos: true } },
        },
      })
      .then(ordenarPorNome),
  ]);

  const segmentos = [
    { valor: "", label: "Todos", contagem: totalTodos },
    { valor: "PF", label: "Pessoa Física", contagem: totalPF },
    { valor: "PJ", label: "Pessoa Jurídica", contagem: totalPJ },
  ] as const;

  function hrefSegmento(valor: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (valor) params.set("tipo", valor);
    const query = params.toString();
    return `/clientes${query ? `?${query}` : ""}`;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={classeTituloPagina}>Clientes</h1>
        <Link href="/clientes/novo" className={classeBotaoPrimario}>
          Novo cliente
        </Link>
      </div>

      <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-superficie p-1 mb-4">
        {segmentos.map((segmento) => {
          const ativo = segmento.valor === tipoAtivo;
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

      <form className="flex gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por nome ou CPF/CNPJ"
          defaultValue={q ?? ""}
          className={`${classeInputAuto} flex-1`}
        />
        <input type="hidden" name="tipo" value={tipoAtivo} />
        <button type="submit" className={classeBotaoSecundario}>
          Buscar
        </button>
      </form>

      {clientes.length === 0 ? (
        <EmptyState
          mensagem="Nenhum cliente encontrado."
          acaoHref="/clientes/novo"
          acaoLabel="Adicionar o primeiro cliente"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Processos ativos</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Próximo prazo</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => {
                const proximo = cliente.processos
                  .flatMap((p) => p.prazos)
                  .sort((a, b) => a.dataFinal.getTime() - b.dataFinal.getTime())[0];
                const whatsapp = linkWhatsapp(cliente.telefone);
                const administrativos = cliente._count.processosAdministrativos;
                return (
                  <tr
                    key={cliente.id}
                    className="border-b border-slate-100 last:border-0 transition-colors hover:bg-fundo"
                  >
                    <td className="font-medium">
                      <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-2 px-4 py-3">
                        {cliente.nome}
                        {cliente.tipo === "PJ" && <span className={classeBadgeNeutro}>PJ</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-texto-secundario">
                      {cliente.telefone || "—"}
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs font-semibold text-tranquilo hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-texto-secundario">
                      {cliente.processos.length}
                      {administrativos > 0 && ` + ${administrativos} adm.`}
                    </td>
                    <td className="px-4 py-3">
                      <ProximoPrazo prazo={proximo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
