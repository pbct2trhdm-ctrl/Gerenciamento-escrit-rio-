import { prisma } from "@/lib/prisma";
import { ordenarPorNome, ordenarProcessosPorCliente } from "@/lib/ordenacao";
import { CompromissoForm } from "@/components/compromisso-form";
import { criarCompromisso } from "@/lib/actions/agenda";
import { diaDeIso, hojeIso } from "@/lib/agenda";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoCompromissoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; data?: string; processoId?: string }>;
}) {
  const { tipo, data, processoId } = await searchParams;
  const tipoPadrao = tipo === "DILIGENCIA" ? "DILIGENCIA" : "REUNIAO";
  const dataPadrao = diaDeIso(data) ? data! : hojeIso();

  const [clientes, processos] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nome: true } }).then(ordenarPorNome),
    prisma.processo
      .findMany({
        where: { status: { in: ["ATIVO", "SUSPENSO"] } },
        select: { id: true, numeroProcesso: true, clienteId: true, cliente: { select: { nome: true } } },
      })
      .then(ordenarProcessosPorCliente),
  ]);

  return (
    <div>
      <LinkVoltar
        href={processoId ? `/processos/${processoId}` : `/agenda?data=${dataPadrao}`}
        label={processoId ? "Voltar para o processo" : "Voltar para a Agenda"}
      />
      <h1 className={`${classeTituloPagina} mb-6`}>
        {tipoPadrao === "REUNIAO" ? "Nova reunião" : "Nova diligência"}
      </h1>
      <CompromissoForm
        tipoPadrao={tipoPadrao}
        dataPadrao={dataPadrao}
        processoIdPadrao={processoId}
        clientes={clientes}
        processos={processos}
        action={criarCompromisso}
      />
    </div>
  );
}
