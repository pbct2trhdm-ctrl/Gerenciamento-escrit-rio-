import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecursoAdministrativoForm } from "@/components/recurso-administrativo-form";
import { criarRecursoAdministrativo } from "@/lib/actions/recursos-administrativos";
import { LABEL_ORGAO_PROCESSO_ADMINISTRATIVO } from "@/lib/formatacao";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoRecursoAdministrativoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processoAdministrativo.findUnique({
    where: { id },
    select: { id: true, orgao: true, numeroProtocolo: true },
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
      <h1 className={`${classeTituloPagina} mb-1`}>Registrar recurso administrativo</h1>
      <p className="text-texto-secundario mb-6">
        {LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}
        {processo.numeroProtocolo ? ` · ${processo.numeroProtocolo}` : ""}
      </p>
      <RecursoAdministrativoForm
        processoAdministrativoId={processo.id}
        action={criarRecursoAdministrativo}
      />
    </div>
  );
}
