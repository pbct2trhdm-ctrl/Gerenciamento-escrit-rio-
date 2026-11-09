import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ordenarPorNome, ordenarProcessosPorCliente } from "@/lib/ordenacao";
import { CompromissoForm } from "@/components/compromisso-form";
import { atualizarCompromisso, excluirCompromisso } from "@/lib/actions/agenda";
import { LABEL_TIPO_COMPROMISSO } from "@/lib/formatacao";
import { BotaoEnvio } from "@/components/botao-envio";
import { classeTituloPagina, classeBotaoPerigo } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarCompromissoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compromisso = await prisma.compromisso.findUnique({ where: { id } });
  if (!compromisso) notFound();

  const [clientes, processos] = await Promise.all([
    prisma.cliente.findMany({ select: { id: true, nome: true } }).then(ordenarPorNome),
    prisma.processo
      .findMany({
        where: { OR: [{ status: { in: ["ATIVO", "SUSPENSO"] } }, { id: compromisso.processoId ?? "" }] },
        select: { id: true, numeroProcesso: true, clienteId: true, cliente: { select: { nome: true } } },
      })
      .then(ordenarProcessosPorCliente),
  ]);
  const dia = compromisso.inicio.toISOString().slice(0, 10);

  return (
    <div>
      <LinkVoltar href={`/agenda?data=${dia}`} label="Voltar para a Agenda" />
      <h1 className={`${classeTituloPagina} mb-6`}>Editar {LABEL_TIPO_COMPROMISSO[compromisso.tipo].toLowerCase()}</h1>
      <CompromissoForm
        compromisso={compromisso}
        dataPadrao={dia}
        clientes={clientes}
        processos={processos}
        action={atualizarCompromisso.bind(null, compromisso.id)}
      />
      <form action={excluirCompromisso.bind(null, compromisso.id)} className="mt-10 max-w-2xl border-t border-slate-200 pt-6">
        <BotaoEnvio
          className={classeBotaoPerigo}
          textoAguardando="Excluindo…"
          confirmacao="Excluir este compromisso da agenda? Não dá para desfazer."
        >
          Excluir da agenda
        </BotaoEnvio>
      </form>
    </div>
  );
}
