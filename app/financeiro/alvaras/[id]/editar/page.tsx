import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlvaraForm } from "@/components/alvara-form";
import { atualizarAlvara, excluirAlvara } from "@/lib/actions/alvaras";

export default async function EditarAlvaraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [alvara, sucumbencias] = await Promise.all([
    prisma.alvara.findUnique({
      where: { id },
      include: { processo: { include: { cliente: true } } },
    }),
    prisma.honorarioSucumbencial.findMany({
      select: { id: true, processoId: true },
    }),
  ]);

  if (!alvara) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-medium">{alvara.processo.cliente.nome}</h2>
        <form action={excluirAlvara.bind(null, alvara.id)}>
          <button
            type="submit"
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </form>
      </div>
      <p className="text-gray-500 mb-6">
        {alvara.processo.numeroProcesso ?? "Processo sem número"}
      </p>
      <AlvaraForm
        alvara={alvara}
        sucumbencias={sucumbencias.filter((s) => s.processoId === alvara.processoId)}
        action={atualizarAlvara.bind(null, id)}
      />
    </div>
  );
}
