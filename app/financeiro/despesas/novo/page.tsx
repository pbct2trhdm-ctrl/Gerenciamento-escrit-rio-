import { prisma } from "@/lib/prisma";
import { ordenarProcessosPorCliente } from "@/lib/ordenacao";
import { DespesaForm } from "@/components/despesa-form";
import { criarDespesa } from "@/lib/actions/despesas";
import { classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovaDespesaPage() {
  const processos = await prisma.processo.findMany({
    orderBy: { criadoEm: "desc" },
    include: { cliente: { select: { nome: true } } },
  }).then(ordenarProcessosPorCliente);

  return (
    <div>
      <LinkVoltar href="/financeiro/despesas" label="Voltar para Despesas" />
      <h2 className={`${classeTituloSecao} mb-6`}>Nova despesa</h2>
      <DespesaForm processos={processos} action={criarDespesa} />
    </div>
  );
}
