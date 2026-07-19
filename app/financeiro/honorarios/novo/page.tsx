import { prisma } from "@/lib/prisma";
import { HonorarioForm } from "@/components/honorario-form";
import { criarHonorario } from "@/lib/actions/honorarios";

export default async function NovoHonorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ processoId?: string }>;
}) {
  const { processoId } = await searchParams;
  const processos = await prisma.processo.findMany({
    orderBy: { criadoEm: "desc" },
    include: { cliente: { select: { nome: true } } },
  });

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">Novo honorário</h2>
      <HonorarioForm
        processos={processos}
        processoIdPadrao={processoId}
        action={criarHonorario}
      />
    </div>
  );
}
