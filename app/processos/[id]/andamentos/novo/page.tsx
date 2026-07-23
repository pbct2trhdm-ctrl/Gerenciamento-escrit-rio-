import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AndamentoForm } from "@/components/andamento-form";
import { criarAndamento } from "@/lib/actions/andamentos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoAndamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    select: { id: true, numeroProcesso: true },
  });

  if (!processo) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href={`/processos/${processo.id}`} label="Voltar para o processo" />
      <h1 className={`${classeTituloPagina} mb-1`}>Registrar andamento</h1>
      <p className="text-texto-secundario mb-6">
        {processo.numeroProcesso ?? "Processo sem número"}
      </p>
      <AndamentoForm processoId={processo.id} action={criarAndamento} />
    </div>
  );
}
