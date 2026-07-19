import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HonorarioForm } from "@/components/honorario-form";
import { atualizarHonorario } from "@/lib/actions/honorarios";

export default async function EditarHonorarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const honorario = await prisma.honorario.findUnique({ where: { id } });

  if (!honorario) {
    notFound();
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">Editar honorário</h2>
      <HonorarioForm
        honorario={honorario}
        action={atualizarHonorario.bind(null, id)}
      />
    </div>
  );
}
