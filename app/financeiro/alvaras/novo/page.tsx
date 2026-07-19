import { prisma } from "@/lib/prisma";
import { AlvaraForm } from "@/components/alvara-form";
import { criarAlvara } from "@/lib/actions/alvaras";
import { classeTituloSecao } from "@/lib/estilos";

export default async function NovoAlvaraPage({
  searchParams,
}: {
  searchParams: Promise<{ processoId?: string }>;
}) {
  const { processoId } = await searchParams;
  const [processos, sucumbencias] = await Promise.all([
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.honorarioSucumbencial.findMany({
      select: { id: true, processoId: true },
    }),
  ]);

  return (
    <div>
      <h2 className={`${classeTituloSecao} mb-6`}>Novo alvará</h2>
      <AlvaraForm
        processos={processos}
        sucumbencias={sucumbencias}
        processoIdPadrao={processoId}
        action={criarAlvara}
      />
    </div>
  );
}
