import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SucumbenciaForm } from "@/components/sucumbencia-form";
import { atualizarSucumbencia, excluirSucumbencia } from "@/lib/actions/sucumbencia";

export default async function EditarSucumbenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sucumbencia = await prisma.honorarioSucumbencial.findUnique({
    where: { id },
    include: { processo: { include: { cliente: true } } },
  });

  if (!sucumbencia) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-medium">
          {sucumbencia.processo.cliente.nome}
        </h2>
        <form action={excluirSucumbencia.bind(null, sucumbencia.id)}>
          <button
            type="submit"
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </form>
      </div>
      <p className="text-gray-500 mb-6">
        <Link href={`/processos/${sucumbencia.processo.id}`} className="underline">
          {sucumbencia.processo.numeroProcesso ?? "Processo sem número"}
        </Link>
      </p>
      <SucumbenciaForm
        sucumbencia={sucumbencia}
        action={atualizarSucumbencia.bind(null, id)}
      />
    </div>
  );
}
