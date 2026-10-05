import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaginaNovaAtualizacao } from "@/components/pagina-nova-atualizacao";
import { LABEL_ORGAO_PROCESSO_ADMINISTRATIVO } from "@/lib/formatacao";

export default async function NovaAtualizacaoClienteAdministrativoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processoAdministrativo.findUnique({
    where: { id },
    select: {
      id: true,
      orgao: true,
      numeroProtocolo: true,
      cliente: { select: { nome: true } },
    },
  });

  if (!processo) {
    notFound();
  }

  return (
    <PaginaNovaAtualizacao
      processoAdministrativoId={processo.id}
      voltarHref={`/processos-administrativos/${processo.id}`}
      subtitulo={`${processo.cliente.nome} · ${LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]} · ${processo.numeroProtocolo ?? "Sem protocolo"}`}
    />
  );
}
