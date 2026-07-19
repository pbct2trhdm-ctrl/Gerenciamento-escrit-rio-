import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_CLIENTE,
  LABEL_AREA,
  LABEL_STATUS_PROCESSO,
  formatarData,
} from "@/lib/formatacao";
import { excluirCliente } from "@/lib/actions/clientes";

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { processos: { orderBy: { criadoEm: "desc" } } },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
        <div className="flex gap-2">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Editar
          </Link>
          <form action={excluirCliente.bind(null, cliente.id)}>
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-gray-500 mb-6">{LABEL_TIPO_CLIENTE[cliente.tipo]}</p>

      <div className="grid grid-cols-2 gap-4 mb-8 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-gray-500">CPF/CNPJ</p>
          <p>{cliente.cpfCnpj || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Telefone</p>
          <p>{cliente.telefone || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Email</p>
          <p>{cliente.email || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Observações</p>
          <p className="whitespace-pre-wrap">{cliente.observacoes || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Processos vinculados</h2>
        <Link
          href={`/processos/novo?clienteId=${cliente.id}`}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo processo
        </Link>
      </div>

      {cliente.processos.length === 0 ? (
        <p className="text-gray-500">Nenhum processo vinculado.</p>
      ) : (
        <ul className="space-y-2">
          {cliente.processos.map((processo) => (
            <li key={processo.id}>
              <Link
                href={`/processos/${processo.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {processo.numeroProcesso ?? "Sem número"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {LABEL_AREA[processo.area]} ·{" "}
                      {processo.varaTribunal ?? "Vara não informada"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {LABEL_STATUS_PROCESSO[processo.status]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatarData(processo.criadoEm)}
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
