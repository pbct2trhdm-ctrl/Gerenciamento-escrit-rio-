import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_TIPO_CLIENTE } from "@/lib/formatacao";
import type { Prisma } from "@/app/generated/prisma/client";

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
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo cliente
        </Link>
      </div>

      <form className="flex gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por nome ou CPF/CNPJ"
          defaultValue={q ?? ""}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Filtrar
        </button>
      </form>

      {clientes.length === 0 ? (
        <p className="text-gray-500">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/clientes/${cliente.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-gray-500">
                      {LABEL_TIPO_CLIENTE[cliente.tipo]}
                      {cliente.cpfCnpj ? ` · ${cliente.cpfCnpj}` : ""}
                    </p>
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
