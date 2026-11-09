import Link from "next/link";
import type { ItemAgenda } from "@/lib/agenda";
import { formatarHorario } from "@/lib/formatacao";
import { alterarStatusCompromisso } from "@/lib/actions/agenda";
import { BotaoEnvio } from "@/components/botao-envio";
import { classeBotaoSecundario, classeBotaoConfirma } from "@/lib/estilos";

const ESTILO_TIPO: Record<ItemAgenda["tipo"], { rotulo: string; faixa: string; selo: string }> = {
  REUNIAO: { rotulo: "Reunião", faixa: "bg-reuniao", selo: "border-reuniao/30 bg-reuniao-fundo text-reuniao" },
  DILIGENCIA: { rotulo: "Diligência", faixa: "bg-diligencia", selo: "border-diligencia/30 bg-diligencia-fundo text-diligencia" },
  AUDIENCIA: { rotulo: "Audiência", faixa: "bg-audiencia", selo: "border-audiencia/30 bg-audiencia-fundo text-audiencia" },
};

export function SeloTipoAgenda({ tipo }: { tipo: ItemAgenda["tipo"] }) {
  const estilo = ESTILO_TIPO[tipo];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${estilo.selo}`}>
      {estilo.rotulo}
    </span>
  );
}

/** Horário "09:00–10:30" (ou só o início). */
export function horarioItem(item: Pick<ItemAgenda, "inicio" | "fim">): string {
  return item.fim ? `${formatarHorario(item.inicio)}–${formatarHorario(item.fim)}` : formatarHorario(item.inicio);
}

/**
 * Cartão de um compromisso ou audiência na Agenda. `compacto` (Dashboard)
 * esconde observações e botões de situação.
 */
export function ItemAgendaCartao({ item, compacto = false }: { item: ItemAgenda; compacto?: boolean }) {
  const estilo = ESTILO_TIPO[item.tipo];
  const cancelado = item.status === "CANCELADO";
  const realizado = item.status === "REALIZADO";

  return (
    <li className={`relative flex gap-4 px-4 py-3 ${cancelado ? "opacity-60" : ""}`}>
      <span className={`absolute inset-y-2 left-0 w-1 rounded-r ${estilo.faixa}`} aria-hidden="true" />
      <div className="w-14 shrink-0 pt-0.5 font-semibold tabular-nums text-texto-principal sm:w-28">
        {horarioItem(item)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={item.href} className={`font-semibold hover:underline ${cancelado ? "line-through" : ""}`}>
            {item.titulo}
          </Link>
          <SeloTipoAgenda tipo={item.tipo} />
          {realizado && (
            <span className="inline-flex items-center rounded-full border border-tranquilo/30 bg-tranquilo-fundo px-2 py-0.5 text-xs font-medium text-tranquilo">
              {item.tipo === "AUDIENCIA" ? "Cumprida" : "Realizada"}
            </span>
          )}
          {cancelado && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-texto-secundario">
              Cancelada
            </span>
          )}
        </div>
        {(item.cliente || item.processo) && (
          <p className="mt-0.5 truncate text-sm text-texto-secundario">
            {item.cliente && (
              <Link href={`/clientes/${item.cliente.id}`} className="font-medium text-texto-principal hover:underline">
                {item.cliente.nome}
              </Link>
            )}
            {item.cliente && item.processo && " · "}
            {item.processo && (
              <Link href={`/processos/${item.processo.id}`} className="font-mono text-xs hover:underline">
                {item.processo.numeroProcesso ?? "processo sem número"}
              </Link>
            )}
          </p>
        )}
        {item.local && <p className="mt-0.5 text-sm text-texto-secundario">📍 {item.local}</p>}
        {item.link && !cancelado && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block text-sm font-medium text-accent underline"
          >
            Entrar na sala on-line
          </a>
        )}
        {!compacto && item.observacoes && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-texto-secundario">{item.observacoes}</p>
        )}
      </div>
      {!compacto && item.origem === "compromisso" && item.status === "AGENDADO" && (
        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-start">
          <form action={alterarStatusCompromisso.bind(null, item.id, "REALIZADO")}>
            <BotaoEnvio className={`${classeBotaoConfirma} !px-3 !py-1 text-xs`} textoAguardando="Salvando…">
              ✓ Realizada
            </BotaoEnvio>
          </form>
          <form action={alterarStatusCompromisso.bind(null, item.id, "CANCELADO")}>
            <BotaoEnvio className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`} textoAguardando="Salvando…">
              Cancelada
            </BotaoEnvio>
          </form>
        </div>
      )}
    </li>
  );
}
