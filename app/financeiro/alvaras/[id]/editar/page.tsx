import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlvaraForm } from "@/components/alvara-form";
import { atualizarAlvara, excluirAlvara } from "@/lib/actions/alvaras";
import { carregarOpcoesAlvara } from "@/lib/alvara-opcoes";
import { classeBotaoPerigo, classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarAlvaraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [alvara, opcoes] = await Promise.all([
    prisma.alvara.findUnique({
      where: { id },
      include: { processo: { include: { cliente: true } } },
    }),
    carregarOpcoesAlvara(id),
  ]);

  if (!alvara) {
    notFound();
  }

  return (
    <div>
      <LinkVoltar href={`/financeiro/alvaras/${alvara.id}`} label="Voltar para o alvará" />
      <div className="flex items-center justify-between mb-1">
        <h2 className={classeTituloSecao}>{alvara.processo.cliente.nome}</h2>
        <form action={excluirAlvara.bind(null, alvara.id)}>
          <button type="submit" className={classeBotaoPerigo}>
            Excluir
          </button>
        </form>
      </div>
      <p className="text-texto-secundario mb-6">
        {alvara.processo.numeroProcesso ?? "Processo sem número"}
      </p>
      <AlvaraForm
        alvara={alvara}
        sucumbencias={opcoes.sucumbencias}
        parcelas={opcoes.parcelas}
        parcelaQuitadaIdAtual={opcoes.parcelaQuitadaIdAtual}
        action={atualizarAlvara.bind(null, id)}
      />
    </div>
  );
}
