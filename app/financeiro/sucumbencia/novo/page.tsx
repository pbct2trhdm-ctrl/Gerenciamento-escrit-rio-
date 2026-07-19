import { prisma } from "@/lib/prisma";
import { SucumbenciaForm } from "@/components/sucumbencia-form";
import { criarSucumbencia } from "@/lib/actions/sucumbencia";
import { classeTituloSecao } from "@/lib/estilos";

export default async function NovaSucumbenciaPage({
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
      <h2 className={`${classeTituloSecao} mb-6`}>Nova sucumbência</h2>
      <SucumbenciaForm
        processos={processos}
        processoIdPadrao={processoId}
        action={criarSucumbencia}
      />
    </div>
  );
}
