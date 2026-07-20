import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HonorarioForm } from "@/components/honorario-form";
import { atualizarHonorario } from "@/lib/actions/honorarios";
import { classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

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
      <LinkVoltar href={`/financeiro/honorarios/${id}`} label="Voltar" />
      <h2 className={`${classeTituloSecao} mb-6`}>Editar honorário</h2>
      <HonorarioForm
        honorario={honorario}
        action={atualizarHonorario.bind(null, id)}
      />
    </div>
  );
}
