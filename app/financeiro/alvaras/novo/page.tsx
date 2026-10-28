import { prisma } from "@/lib/prisma";
import { ordenarProcessosPorCliente } from "@/lib/ordenacao";
import { AlvaraForm } from "@/components/alvara-form";
import { criarAlvara } from "@/lib/actions/alvaras";
import { carregarOpcoesAlvara } from "@/lib/alvara-opcoes";
import { classeTituloSecao } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoAlvaraPage({
  searchParams,
}: {
  searchParams: Promise<{ processoId?: string }>;
}) {
  const { processoId } = await searchParams;
  const [processos, opcoes] = await Promise.all([
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      include: { cliente: { select: { nome: true } } },
    }).then(ordenarProcessosPorCliente),
    carregarOpcoesAlvara(),
  ]);

  return (
    <div>
      <LinkVoltar
        href={processoId ? `/processos/${processoId}` : "/financeiro/alvaras"}
        label={processoId ? "Voltar para o processo" : "Voltar para Alvarás"}
      />
      <h2 className={`${classeTituloSecao} mb-6`}>Novo alvará</h2>
      <AlvaraForm
        processos={processos}
        sucumbencias={opcoes.sucumbencias}
        parcelas={opcoes.parcelas}
        processoIdPadrao={processoId}
        action={criarAlvara}
      />
    </div>
  );
}
