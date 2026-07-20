import { prisma } from "@/lib/prisma";
import { ProcessoForm } from "@/components/processo-form";
import { criarProcesso } from "@/lib/actions/processos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

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
      <LinkVoltar
        href={clienteId ? `/clientes/${clienteId}` : "/processos"}
        label={clienteId ? "Voltar para o cliente" : "Voltar para Processos"}
      />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo processo</h1>
      <ProcessoForm
        clientes={clientes}
        clienteIdPadrao={clienteId}
        action={criarProcesso}
      />
    </div>
  );
}
