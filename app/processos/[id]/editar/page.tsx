import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProcessoForm } from "@/components/processo-form";
import { atualizarProcesso } from "@/lib/actions/processos";

export default async function EditarProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [processo, clientes] = await Promise.all([
    prisma.processo.findUnique({ where: { id } }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, cpfCnpj: true },
    }),
  ]);

  if (!processo) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Editar processo</h1>
      <ProcessoForm
        processo={processo}
        clientes={clientes}
        action={atualizarProcesso.bind(null, id)}
      />
    </div>
  );
}
