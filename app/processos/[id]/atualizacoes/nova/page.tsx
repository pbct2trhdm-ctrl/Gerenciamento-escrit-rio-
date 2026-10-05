import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaginaNovaAtualizacao } from "@/components/pagina-nova-atualizacao";

export default async function NovaAtualizacaoClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    select: { id: true, numeroProcesso: true, cliente: { select: { nome: true } } },
  });

  if (!processo) {
    notFound();
  }

  return (
    <PaginaNovaAtualizacao
      processoId={processo.id}
      voltarHref={`/processos/${processo.id}`}
      subtitulo={`${processo.cliente.nome} · ${processo.numeroProcesso ?? "Processo sem número"}`}
    />
  );
}
