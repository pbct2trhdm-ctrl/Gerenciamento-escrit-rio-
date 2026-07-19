import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DespesaForm } from "@/components/despesa-form";
import { atualizarDespesa, excluirDespesa } from "@/lib/actions/despesas";

export default async function EditarDespesaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [despesa, processos] = await Promise.all([
    prisma.despesa.findUnique({ where: { id } }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  if (!despesa) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Editar despesa</h2>
        <form action={excluirDespesa.bind(null, despesa.id)}>
          <button
            type="submit"
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </form>
      </div>
      <DespesaForm
        despesa={despesa}
        processos={processos}
        action={atualizarDespesa.bind(null, id)}
      />
    </div>
  );
}
