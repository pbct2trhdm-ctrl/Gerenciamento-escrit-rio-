import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AndamentoForm } from "@/components/andamento-form";
import { criarAndamento } from "@/lib/actions/andamentos";
import { LABEL_ORGAO_PROCESSO_ADMINISTRATIVO } from "@/lib/formatacao";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoAndamentoAdministrativoPage({
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
      recursos: {
        orderBy: { dataInterposicao: "desc" },
        select: { id: true, orgaoRecursal: true, dataInterposicao: true },
      },
    },
  });

  if (!processo) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar
        href={`/processos-administrativos/${processo.id}`}
        label="Voltar para o processo administrativo"
      />
      <h1 className={`${classeTituloPagina} mb-1`}>Registrar andamento</h1>
      <p className="text-texto-secundario mb-6">
        {LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}
        {processo.numeroProtocolo ? ` · ${processo.numeroProtocolo}` : ""}
      </p>
      <AndamentoForm
        contexto="administrativo"
        processoAdministrativoId={processo.id}
        recursosAdministrativos={processo.recursos}
        action={criarAndamento}
      />
    </div>
  );
}
