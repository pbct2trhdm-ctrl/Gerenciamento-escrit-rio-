import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParcelaForm } from "@/components/parcela-form";
import { atualizarParcela } from "@/lib/actions/honorarios";
import { classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarParcelaPage({
  params,
}: {
  params: Promise<{ id: string; parcelaId: string }>;
}) {
  const { id, parcelaId } = await params;
  const parcela = await prisma.parcela.findUnique({ where: { id: parcelaId } });

  if (!parcela || parcela.honorarioId !== id) {
    notFound();
  }

  return (
    <div className="max-w-xl">
      <LinkVoltar href={`/financeiro/honorarios/${id}`} label="Voltar" />
      <h2 className={`${classeTituloSecao} mb-6`}>Editar parcela</h2>
      <ParcelaForm
        parcela={parcela}
        action={atualizarParcela.bind(null, parcelaId, id)}
      />
    </div>
  );
}
