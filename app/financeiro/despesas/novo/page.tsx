import { prisma } from "@/lib/prisma";
import { DespesaForm } from "@/components/despesa-form";
import { criarDespesa } from "@/lib/actions/despesas";
import { classeTituloSecao } from "@/lib/estilos";

export default async function NovaDespesaPage() {
  const processos = await prisma.processo.findMany({
    orderBy: { criadoEm: "desc" },
    include: { cliente: { select: { nome: true } } },
  });

  return (
    <div>
      <h2 className={`${classeTituloSecao} mb-6`}>Nova despesa</h2>
      <DespesaForm processos={processos} action={criarDespesa} />
    </div>
  );
}
