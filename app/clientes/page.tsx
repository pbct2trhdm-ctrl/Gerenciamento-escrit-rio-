import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_TIPO_CLIENTE } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";
import { EmptyState } from "@/components/empty-state";
import {
  classeInputAuto,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeTituloPagina,
} from "@/lib/estilos";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q, tipo } = await searchParams;

  const where: Prisma.ClienteWhereInput = {};
  if (q) {
    where.OR = [
      { nome: { contains: q } },
      { cpfCnpj: { contains: q } },
    ];
  }
  if (tipo === "PF" || tipo === "PJ") {
    where.tipo = tipo;
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={classeTituloPagina}>Clientes</h1>
        <Link href="/clientes/novo" className={classeBotaoPrimario}>
          Novo cliente
        </Link>
      </div>

      <form className="flex gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por nome ou CPF/CNPJ"
          defaultValue={q ?? ""}
          className={`${classeInputAuto} flex-1`}
        />
        <select name="tipo" defaultValue={tipo ?? ""} className={classeInputAuto}>
          <option value="">Todos os tipos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
        <button type="submit" className={classeBotaoSecundario}>
          Filtrar
        </button>
      </form>

      {clientes.length === 0 ? (
        <EmptyState
          mensagem="Nenhum cliente encontrado."
          acaoHref="/clientes/novo"
          acaoLabel="Adicionar o primeiro cliente"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">CPF/CNPJ</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-gray-100 last:border-0 transition-colors hover:bg-fundo"
                >
                  <td className="font-medium">
                    <Link href={`/clientes/${cliente.id}`} className="block px-4 py-3">
                      {cliente.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-texto-secundario">
                    {LABEL_TIPO_CLIENTE[cliente.tipo]}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-texto-secundario">
                    {cliente.cpfCnpj || "—"}
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
