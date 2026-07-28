import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProcessoAdministrativoForm } from "@/components/processo-administrativo-form";
import { atualizarProcessoAdministrativo } from "@/lib/actions/processos-administrativos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarProcessoAdministrativoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [processoAdministrativo, clientes, processosJudiciais] = await Promise.all([
    prisma.processoAdministrativo.findUnique({ where: { id } }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, cpfCnpj: true },
    }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        numeroProcesso: true,
        cliente: { select: { nome: true } },
      },
    }),
  ]);

  if (!processoAdministrativo) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href={`/processos-administrativos/${id}`} label="Voltar" />
      <h1 className={`${classeTituloPagina} mb-6`}>Editar processo administrativo</h1>
      <ProcessoAdministrativoForm
        processoAdministrativo={processoAdministrativo}
        clientes={clientes}
        processosJudiciais={processosJudiciais}
        action={atualizarProcessoAdministrativo.bind(null, id)}
      />
    </div>
  );
}
