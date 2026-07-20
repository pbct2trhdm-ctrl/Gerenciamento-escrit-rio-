import { prisma } from "@/lib/prisma";
import { SucumbenciaForm } from "@/components/sucumbencia-form";
import { criarSucumbencia } from "@/lib/actions/sucumbencia";
import { classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

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
      <LinkVoltar
        href={processoId ? `/processos/${processoId}` : "/financeiro/sucumbencia"}
        label={processoId ? "Voltar para o processo" : "Voltar para Sucumbência"}
      />
      <h2 className={`${classeTituloSecao} mb-6`}>Nova sucumbência</h2>
      <SucumbenciaForm
        processos={processos}
        processoIdPadrao={processoId}
        action={criarSucumbencia}
      />
    </div>
  );
}
