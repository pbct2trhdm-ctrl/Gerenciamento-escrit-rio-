import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DespesaForm } from "@/components/despesa-form";
import { atualizarDespesa, excluirDespesa } from "@/lib/actions/despesas";
import { classeBotaoPerigo, classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarDespesaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [despesa, processos] = await Promise.all([
    prisma.despesa.findUnique({ where: { id } }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  if (!despesa) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href="/financeiro/despesas" label="Voltar para Despesas" />
      <div className="flex items-center justify-between mb-6">
        <h2 className={classeTituloSecao}>Editar despesa</h2>
        <form action={excluirDespesa.bind(null, despesa.id)}>
          <button type="submit" className={classeBotaoPerigo}>
            Excluir
          </button>
        </form>
      </div>
      <DespesaForm
        despesa={despesa}
        processos={processos}
        action={atualizarDespesa.bind(null, id)}
      />
    </div>
  );
}
