import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrazoForm } from "@/components/prazo-form";
import { atualizarPrazo } from "@/lib/actions/prazos";
import { classeTituloPagina } from "@/lib/estilos";

export default async function EditarPrazoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prazo, processos] = await Promise.all([
    prisma.prazo.findUnique({ where: { id } }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: { id: true, numeroProcesso: true },
    }),
  ]);

  if (!prazo) {
    notFound();
  }

  return (
    <div>
      <h1 className={`${classeTituloPagina} mb-6`}>Editar prazo</h1>
      <PrazoForm
        prazo={prazo}
        processos={processos}
        action={atualizarPrazo.bind(null, id)}
      />
    </div>
  );
}
