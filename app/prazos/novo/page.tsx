import { prisma } from "@/lib/prisma";
import { ordenarProcessosPorCliente } from "@/lib/ordenacao";
import { PrazoForm } from "@/components/prazo-form";
import { criarPrazo } from "@/lib/actions/prazos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoPrazoPage({
  searchParams,
}: {
  searchParams: Promise<{ processoId?: string }>;
}) {
  const { processoId } = await searchParams;
  const processos = await prisma.processo.findMany({
    orderBy: { criadoEm: "desc" },
    select: { id: true, numeroProcesso: true, cliente: { select: { nome: true } } },
  }).then(ordenarProcessosPorCliente);

  return (
    <div>
      <LinkVoltar
        href={processoId ? `/processos/${processoId}` : "/prazos"}
        label={processoId ? "Voltar para o processo" : "Voltar para Prazos"}
      />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo prazo</h1>
      <PrazoForm
        processos={processos}
        processoIdPadrao={processoId}
        action={criarPrazo}
      />
    </div>
  );
}
