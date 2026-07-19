import { prisma } from "@/lib/prisma";
import { PrazoForm } from "@/components/prazo-form";
import { criarPrazo } from "@/lib/actions/prazos";

export default async function NovoPrazoPage({
  searchParams,
}: {
  searchParams: Promise<{ processoId?: string }>;
}) {
  const { processoId } = await searchParams;
  const processos = await prisma.processo.findMany({
    orderBy: { criadoEm: "desc" },
    select: { id: true, numeroProcesso: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Novo prazo</h1>
      <PrazoForm
        processos={processos}
        processoIdPadrao={processoId}
        action={criarPrazo}
      />
    </div>
  );
}
