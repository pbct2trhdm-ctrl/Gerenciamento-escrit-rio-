import Link from "next/link";
import { diaDeIso, hojeIso, isoDeDia, itensDaAgenda, prazosQueVencemNoDia, somarDias } from "@/lib/agenda";
import { tituloPrazo } from "@/lib/exibicao-prazo";
import { ItemAgendaCartao, SeloTipoAgenda, horarioItem } from "@/components/item-agenda";
import { classeBotaoPrimario, classeBotaoSecundario, classeInputAuto, classeTituloPagina } from "@/lib/estilos";

const DATA_TITULO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DIA_SEMANA_CURTO = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data } = await searchParams;
  const hoje = diaDeIso(hojeIso())!;
  const dia = diaDeIso(data) ?? hoje;
  const ehHoje = dia.getTime() === hoje.getTime();

  // Semana de segunda a domingo que contém o dia escolhido.
  const segunda = somarDias(dia, -((dia.getUTCDay() + 6) % 7));
  const domingoSeguinte = somarDias(segunda, 7);
  const fimProximos = somarDias(dia, 15);

  const [itensSemana, itensProximos, prazosDoDia] = await Promise.all([
    itensDaAgenda(segunda, domingoSeguinte),
    itensDaAgenda(somarDias(dia, 1), fimProximos),
    prazosQueVencemNoDia(dia),
  ]);
  const itensDoDia = itensSemana.filter((i) => i.inicio >= dia && i.inicio < somarDias(dia, 1));
  const proximos = itensProximos.filter((i) => i.status !== "CANCELADO");

  const diasDaSemana = Array.from({ length: 7 }, (_, n) => {
    const d = somarDias(segunda, n);
    const total = itensSemana.filter(
      (i) => i.status !== "CANCELADO" && i.inicio >= d && i.inicio < somarDias(d, 1)
    ).length;
    return { dia: d, total };
  });

  const proximosPorDia = new Map<string, typeof proximos>();
  for (const item of proximos) {
    const chave = item.inicio.toISOString().slice(0, 10);
    proximosPorDia.set(chave, [...(proximosPorDia.get(chave) ?? []), item]);
  }

  const iso = isoDeDia(dia);

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Agenda</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/agenda/novo?tipo=DILIGENCIA&data=${iso}`} className={classeBotaoSecundario}>
            Nova diligência
          </Link>
          <Link href={`/agenda/novo?tipo=REUNIAO&data=${iso}`} className={classeBotaoPrimario}>
            Nova reunião
          </Link>
        </div>
      </div>

      {/* Navegação entre dias */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/agenda?data=${isoDeDia(somarDias(dia, -1))}`} className={classeBotaoSecundario} aria-label="Dia anterior">
          ←
        </Link>
        <Link href={`/agenda?data=${isoDeDia(somarDias(dia, 1))}`} className={classeBotaoSecundario} aria-label="Próximo dia">
          →
        </Link>
        {!ehHoje && (
          <Link href="/agenda" className={classeBotaoSecundario}>
            Hoje
          </Link>
        )}
        <form action="/agenda" className="ml-auto flex gap-2">
          <label htmlFor="data-agenda" className="sr-only">
            Ir para a data
          </label>
          <input id="data-agenda" type="date" name="data" defaultValue={iso} className={classeInputAuto} />
          <button type="submit" className={classeBotaoSecundario}>
            Ir
          </button>
        </form>
      </div>

      {/* Semana */}
      <ol className="mb-6 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Semana">
        {diasDaSemana.map(({ dia: d, total }) => {
          const selecionado = d.getTime() === dia.getTime();
          const ehDiaDeHoje = d.getTime() === hoje.getTime();
          return (
            <li key={d.toISOString()}>
              <Link
                href={`/agenda?data=${isoDeDia(d)}`}
                aria-current={selecionado ? "date" : undefined}
                className={`flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-colors ${
                  selecionado
                    ? "border-base-escura bg-base-escura text-white"
                    : "border-slate-200 bg-superficie hover:border-accent/40"
                }`}
              >
                <span className={`text-[11px] uppercase tracking-wide ${selecionado ? "text-white/70" : "text-texto-secundario"}`}>
                  {DIA_SEMANA_CURTO.format(d).replace(".", "")}
                </span>
                <span className={`font-display text-lg font-semibold leading-tight ${ehDiaDeHoje && !selecionado ? "text-accent underline" : ""}`}>
                  {d.getUTCDate()}
                </span>
                <span className={`text-[11px] ${selecionado ? "text-white/80" : total ? "text-accent font-medium" : "text-texto-secundario/50"}`}>
                  {total ? `${total} ${total === 1 ? "item" : "itens"}` : "livre"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <h2 className="mb-3 font-display text-lg font-semibold first-letter:uppercase">
        {ehHoje ? "Hoje, " : ""}
        {DATA_TITULO.format(dia)}
      </h2>

      {itensDoDia.length === 0 ? (
        <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-superficie/60 px-4 py-6 text-center text-sm text-texto-secundario">
          Nenhuma reunião, diligência ou audiência neste dia.{" "}
          <Link href={`/agenda/novo?tipo=REUNIAO&data=${iso}`} className="text-accent underline">
            Agendar reunião
          </Link>{" "}
          ou{" "}
          <Link href={`/agenda/novo?tipo=DILIGENCIA&data=${iso}`} className="text-accent underline">
            diligência
          </Link>
          .
        </div>
      ) : (
        <ul className="mb-6 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-superficie shadow-xs">
          {itensDoDia.map((item) => (
            <ItemAgendaCartao key={`${item.origem}-${item.id}`} item={item} />
          ))}
        </ul>
      )}

      {prazosDoDia.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-texto-secundario">
            Prazos que vencem neste dia
          </h3>
          <ul className="space-y-1.5 text-sm">
            {prazosDoDia.map((prazo) => (
              <li key={prazo.id}>
                <Link href={`/prazos/${prazo.id}`} className="hover:underline">
                  <span className="font-medium text-critico">{tituloPrazo(prazo).titulo}</span>
                  <span className="text-texto-secundario">
                    {" · "}
                    {prazo.processo.cliente.nome} · {prazo.processo.numeroProcesso ?? "sem número"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-texto-secundario">
          Próximos 15 dias
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </h2>
        {proximos.length === 0 ? (
          <p className="text-sm text-texto-secundario">Nada agendado.</p>
        ) : (
          <div className="space-y-4">
            {[...proximosPorDia.entries()].map(([chave, itens]) => (
              <div key={chave}>
                <Link href={`/agenda?data=${chave}`} className="mb-1 block text-sm font-semibold first-letter:uppercase hover:underline">
                  {DIA_E_MES.format(diaDeIso(chave)!)}
                </Link>
                <ul className="space-y-1">
                  {itens.map((item) => (
                    <li key={`${item.origem}-${item.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="w-24 shrink-0 tabular-nums text-texto-secundario">{horarioItem(item)}</span>
                      <Link href={item.href} className="font-medium hover:underline">
                        {item.titulo}
                      </Link>
                      <SeloTipoAgenda tipo={item.tipo} />
                      {item.cliente && <span className="text-texto-secundario">{item.cliente.nome}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
