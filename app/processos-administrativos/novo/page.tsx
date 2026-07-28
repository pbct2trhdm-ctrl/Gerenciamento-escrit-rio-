import { prisma } from "@/lib/prisma";
import { ProcessoAdministrativoForm } from "@/components/processo-administrativo-form";
import { criarProcessoAdministrativo } from "@/lib/actions/processos-administrativos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoProcessoAdministrativoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;

  const [clientes, processosJudiciais] = await Promise.all([
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

  return (
    <div>
      <LinkVoltar href="/processos-administrativos" label="Voltar para Processos Administrativos" />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo processo administrativo</h1>
      <ProcessoAdministrativoForm
        clientes={clientes}
        processosJudiciais={processosJudiciais}
        clienteIdPadrao={clienteId}
        action={criarProcessoAdministrativo}
      />
    </div>
  );
}
