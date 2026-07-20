import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SucumbenciaForm } from "@/components/sucumbencia-form";
import { atualizarSucumbencia, excluirSucumbencia } from "@/lib/actions/sucumbencia";
import { classeBotaoPerigo, classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarSucumbenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sucumbencia = await prisma.honorarioSucumbencial.findUnique({
    where: { id },
    include: { processo: { include: { cliente: true } } },
  });

  if (!sucumbencia) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href="/financeiro/sucumbencia" label="Voltar para Sucumbência" />
      <div className="flex items-center justify-between mb-1">
        <h2 className={classeTituloSecao}>{sucumbencia.processo.cliente.nome}</h2>
        <form action={excluirSucumbencia.bind(null, sucumbencia.id)}>
          <button type="submit" className={classeBotaoPerigo}>
            Excluir
          </button>
        </form>
      </div>
      <p className="text-texto-secundario mb-6">
        <Link href={`/processos/${sucumbencia.processo.id}`} className="underline">
          {sucumbencia.processo.numeroProcesso ?? "Processo sem número"}
        </Link>
      </p>
      <SucumbenciaForm
        sucumbencia={sucumbencia}
        action={atualizarSucumbencia.bind(null, id)}
      />
    </div>
  );
}
