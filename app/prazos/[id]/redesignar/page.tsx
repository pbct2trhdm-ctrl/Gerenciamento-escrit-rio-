import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RedesignacaoForm } from "@/components/redesignacao-form";
import { criarRedesignacao } from "@/lib/actions/redesignacoes";
import { formatarDataHorario } from "@/lib/formatacao";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function RedesignarAudienciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const prazo = await prisma.prazo.findUnique({
    where: { id },
    include: { processo: { include: { cliente: true } } },
  });

  if (!prazo || prazo.tipo !== "AUDIENCIA") {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href={`/prazos/${prazo.id}`} label="Voltar para o prazo" />
      <h1 className={`${classeTituloPagina} mb-1`}>Redesignar audiência</h1>
      <p className="text-texto-secundario mb-6">
        {prazo.processo.cliente.nome} · {prazo.processo.numeroProcesso ?? "Sem número"} · marcada
        para {formatarDataHorario(prazo.dataFinal)}
      </p>
      <RedesignacaoForm action={criarRedesignacao.bind(null, prazo.id)} />
    </div>
  );
}
