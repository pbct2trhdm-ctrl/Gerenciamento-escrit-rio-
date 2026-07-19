import { prisma } from "@/lib/prisma";
import { ProcessoForm } from "@/components/processo-form";
import { criarProcesso } from "@/lib/actions/processos";
import { classeTituloPagina } from "@/lib/estilos";

export default async function NovoProcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, cpfCnpj: true },
  });

  return (
    <div>
      <h1 className={`${classeTituloPagina} mb-6`}>Novo processo</h1>
      <ProcessoForm
        clientes={clientes}
        clienteIdPadrao={clienteId}
        action={criarProcesso}
      />
    </div>
  );
}
