import Link from "next/link";
import { hojeComoData } from "@/lib/datas";
import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { formatarData, formatarMoeda } from "@/lib/formatacao";
import { tierPorDiasRestantes, TIER_CLASSES } from "@/lib/urgencia";
import { statusEfetivoParcela, primeiroDiaMes, dentroDoMes } from "@/lib/financeiro";
import { tituloPrazo, textoDiasRestantes } from "@/lib/exibicao-prazo";
import { LinhaPrazo } from "@/components/linha-prazo";
import { ItemAgendaCartao, SeloTipoAgenda, horarioItem } from "@/components/item-agenda";
import { BotaoConfirmarPrazo } from "@/components/prazo-a-conferir";
import { diaDeIso, hojeIso, isoDeDia, itensDaAgenda, somarDias } from "@/lib/agenda";
import { EmptyState } from "@/components/empty-state";
import { classeTituloPagina } from "@/lib/estilos";

const FILTROS = ["hoje", "semana", "conferir", "todos"] as const;
type Filtro = (typeof FILTROS)[number];
const TITULO_FILTRO: Record<Filtro, string> = {
  hoje: "Prazos de hoje e atrasados",
  semana: "Prazos dos próximos 7 dias",
  conferir: "Prazos a conferir",
  todos: "Todos os prazos pendentes",
};

const FUSO = "America/Belem";
const DATA_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: FUSO,
});
const DIA_CURTO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: FUSO });

function saudacao(agora: Date): string {
  const hora = Number(HORA.format(agora));
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

const classePainel = "rounded-xl border border-slate-200 bg-superficie shadow-xs";

function TituloSecao({ children, acao }: { children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-texto-secundario">
      <h2>{children}</h2>
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      {acao}
    </div>
  );
}

/**
 * Tela inicial: resumo do dia (agenda e prazos de hoje), dos próximos 7 dias
 * e das pendências (publicações novas, prazos a conferir, financeiro).
 * Os números do topo abrem a lista de prazos filtrada (?filtro=…).
 */
export default async function ResumoPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro: filtroBruto } = await searchParams;
  const filtro = (FILTROS as readonly string[]).includes(filtroBruto ?? "") ? (filtroBruto as Filtro) : null;

  const agora = new Date();
  const hoje = diaDeIso(hojeIso(agora))!;
  const inicioMes = primeiroDiaMes(hojeComoData(agora));

  const [prazosPendentes, publicacoesNovas, totalPublicacoesNovas, publicacoesPrazoADefinir, agenda, parcelasPendentes, alvarasAguardando] =
    await Promise.all([
      prisma.prazo.findMany({
        where: { status: "PENDENTE" },
        orderBy: { dataFinal: "asc" },
        include: { processo: { include: { cliente: true } } },
      }),
      prisma.publicacao.findMany({
        where: { lida: false },
        orderBy: { dataPublicacao: "desc" },
        take: 5,
        include: { processo: { select: { numeroProcesso: true, cliente: { select: { nome: true } } } } },
      }),
      prisma.publicacao.count({ where: { lida: false } }),
      prisma.publicacao.findMany({
        where: { prazoADefinir: true },
        orderBy: { dataPublicacao: "asc" },
        include: { processo: { include: { cliente: true } } },
      }),
      itensDaAgenda(hoje, somarDias(hoje, 8)),
      prisma.parcela.findMany({ where: { status: "PENDENTE" }, select: { valor: true, vencimento: true, status: true } }),
      prisma.alvara.findMany({ where: { status: "AGUARDANDO_REPASSE" }, select: { valorRepassado: true } }),
    ]);

  const prazos = prazosPendentes.map((prazo) => {
    const dias = diasRestantes(prazo.dataFinal, agora);
    return { prazo, dias, tier: tierPorDiasRestantes(dias) };
  });
  const agendaAtiva = agenda.filter((i) => i.status !== "CANCELADO");
  const agendaHoje = agendaAtiva.filter((i) => i.inicio < somarDias(hoje, 1));
  // Audiência de hoje já aparece na agenda; atrasada (não marcada como cumprida) fica nos prazos.
  const prazosHoje = prazos.filter((p) => p.dias < 0 || (p.dias === 0 && p.prazo.tipo !== "AUDIENCIA"));
  const aConferir = prazos.filter((p) => p.prazo.aConferir);

  const proximosDias = Array.from({ length: 7 }, (_, n) => {
    const dia = somarDias(hoje, n + 1);
    const fim = somarDias(dia, 1);
    return {
      dia,
      agenda: agendaAtiva.filter((i) => i.inicio >= dia && i.inicio < fim),
      prazos: prazos.filter((p) => p.dias === n + 1 && p.prazo.tipo !== "AUDIENCIA"),
    };
  });
  const prazosDepois = prazos.filter((p) => p.dias > 7 && p.prazo.tipo !== "AUDIENCIA").length;

  const parcelasAtrasadas = parcelasPendentes.filter((p) => statusEfetivoParcela(p, agora) === "ATRASADO");
  const parcelasDoMes = parcelasPendentes.filter(
    (p) => statusEfetivoParcela(p, agora) === "PENDENTE" && dentroDoMes(p.vencimento, inicioMes)
  );
  const soma = (lista: { valor: number }[]) => lista.reduce((t, p) => t + p.valor, 0);
  const totalRepassar = alvarasAguardando.reduce((t, a) => t + a.valorRepassado, 0);

  const indicadores = [
    {
      chave: "hoje",
      rotulo: prazos.some((p) => p.dias < 0) ? "prazos hoje ou atrasados" : "prazos vencem hoje",
      total: prazos.filter((p) => p.dias <= 0).length,
      cor: "text-critico",
      href: "/?filtro=hoje",
    },
    {
      chave: "semana",
      rotulo: "prazos em 7 dias",
      total: prazos.filter((p) => p.dias >= 1 && p.dias <= 7).length,
      cor: "text-atencao",
      href: "/?filtro=semana",
    },
    { chave: "agenda", rotulo: "na agenda hoje", total: agendaHoje.length, cor: "text-reuniao", href: "/agenda" },
    { chave: "conferir", rotulo: "a conferir", total: aConferir.length, cor: "text-texto-principal", href: "/?filtro=conferir" },
    { chave: "publicacoes", rotulo: "publicações novas", total: totalPublicacoesNovas, cor: "text-accent", href: "/publicacoes" },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className={classeTituloPagina}>{saudacao(agora)}!</h1>
      <p className="mb-6 text-texto-secundario first-letter:uppercase">{DATA_EXTENSO.format(agora)}</p>

      <ul className="mb-6 grid grid-cols-5 gap-2 sm:gap-3">
        {indicadores.map((item) => {
          const ativo = item.chave === filtro;
          return (
            <li key={item.chave}>
              <Link
                href={ativo ? "/" : item.href}
                aria-current={ativo ? "true" : undefined}
                className={`flex h-full flex-col rounded-xl border bg-superficie px-2 py-2.5 shadow-xs transition-colors sm:px-4 sm:py-3 hover:border-accent/50 ${
                  ativo ? "border-accent ring-1 ring-accent" : "border-slate-200"
                }`}
              >
                <span
                  className={`font-display text-2xl sm:text-3xl font-semibold leading-none tabular-nums ${
                    item.total > 0 ? item.cor : "text-texto-secundario/50"
                  }`}
                >
                  {item.total}
                </span>
                <span className="mt-1 text-[11px] leading-tight text-texto-secundario sm:mt-1.5 sm:text-sm">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtro ? (
        <ListaFiltrada filtro={filtro} prazos={prazos} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal: hoje e próximos dias */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <section>
              <TituloSecao
                acao={
                  <Link href="/agenda" className="normal-case tracking-normal font-medium text-accent">
                    Abrir agenda
                  </Link>
                }
              >
                Hoje
              </TituloSecao>
              {agendaHoje.length === 0 && prazosHoje.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-superficie/60 px-4 py-4 text-sm text-texto-secundario">
                  Nenhum compromisso nem prazo vencendo hoje.{" "}
                  <Link href="/agenda/novo?tipo=REUNIAO" className="text-accent underline">
                    Agendar reunião
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {agendaHoje.length > 0 && (
                    <ul className={`divide-y divide-slate-100 overflow-hidden ${classePainel}`} aria-label="Agenda de hoje">
                      {agendaHoje.map((item) => (
                        <ItemAgendaCartao key={`${item.origem}-${item.id}`} item={item} compacto />
                      ))}
                    </ul>
                  )}
                  {prazosHoje.length > 0 && (
                    <ul className={`divide-y divide-slate-100 overflow-hidden ${classePainel}`} aria-label="Prazos de hoje e atrasados">
                      {prazosHoje.map(({ prazo, dias, tier }) => (
                        <LinhaPrazo key={prazo.id} prazo={prazo} dias={dias} tier={tier} />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section>
              <TituloSecao
                acao={
                  <Link href="/?filtro=todos" className="normal-case tracking-normal font-medium text-accent">
                    Todos os prazos
                  </Link>
                }
              >
                Próximos 7 dias
              </TituloSecao>
              <div className={`divide-y divide-slate-100 ${classePainel}`}>
                {proximosDias.map(({ dia, agenda: itens, prazos: prazosDia }) => (
                  <div key={dia.toISOString()} className="flex gap-3 px-4 py-3">
                    <Link
                      href={`/agenda?data=${isoDeDia(dia)}`}
                      className="w-24 shrink-0 text-sm font-semibold first-letter:uppercase hover:underline sm:w-32"
                    >
                      {DIA_CURTO.format(dia).replace("-feira", "")}
                    </Link>
                    {itens.length === 0 && prazosDia.length === 0 ? (
                      <span className="text-sm text-texto-secundario/60">Livre</span>
                    ) : (
                      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                        {itens.map((item) => (
                          <li key={`${item.origem}-${item.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="tabular-nums text-texto-secundario">{horarioItem(item)}</span>
                            <Link href={item.href} className="font-medium hover:underline">
                              {item.titulo}
                            </Link>
                            <SeloTipoAgenda tipo={item.tipo} />
                            {item.cliente && <span className="truncate text-texto-secundario">{item.cliente.nome}</span>}
                          </li>
                        ))}
                        {prazosDia.map(({ prazo, dias, tier }) => (
                          <li key={prazo.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_CLASSES[tier]}`}>
                              Prazo · {textoDiasRestantes(dias)}
                            </span>
                            <Link href={`/processos/${prazo.processoId}`} className="font-medium hover:underline">
                              {tituloPrazo(prazo).titulo}
                            </Link>
                            <span className="truncate text-texto-secundario">{prazo.processo.cliente.nome}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              {prazosDepois > 0 && (
                <p className="mt-2 text-sm text-texto-secundario">
                  Depois disso: {prazosDepois} prazo{prazosDepois === 1 ? "" : "s"}.{" "}
                  <Link href="/prazos" className="text-accent underline">
                    Ver em Prazos
                  </Link>
                </p>
              )}
            </section>
          </div>

          {/* Coluna lateral: pendências */}
          <aside className="min-w-0 space-y-6">
            <section>
              <TituloSecao
                acao={
                  <Link href="/publicacoes" className="normal-case tracking-normal font-medium text-accent">
                    Ver todas
                  </Link>
                }
              >
                Publicações novas · {totalPublicacoesNovas}
              </TituloSecao>
              {publicacoesPrazoADefinir.length > 0 && (
                <div className="mb-3 rounded-lg border border-atencao/40 bg-atencao-fundo px-3 py-2 text-sm">
                  <p className="font-semibold text-atencao">
                    {publicacoesPrazoADefinir.length} sem prazo identificado — defina o prazo
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {publicacoesPrazoADefinir.map((publicacao) => (
                      <li key={publicacao.id}>
                        <Link href={`/publicacoes/${publicacao.id}`} className="text-atencao underline">
                          {formatarData(publicacao.dataPublicacao)} · {publicacao.processo?.cliente.nome ?? "sem processo"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {publicacoesNovas.length === 0 ? (
                <p className="text-sm text-texto-secundario">Nenhuma publicação nova.</p>
              ) : (
                <ul className={`divide-y divide-slate-100 ${classePainel}`}>
                  {publicacoesNovas.map((publicacao) => (
                    <li key={publicacao.id}>
                      <Link href={`/publicacoes/${publicacao.id}`} className="block px-3 py-2.5 text-sm hover:bg-fundo">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          <span className="font-semibold tabular-nums">{formatarData(publicacao.dataPublicacao)}</span>
                          <span className="truncate text-texto-secundario">
                            {publicacao.processo?.cliente.nome ?? "Sem processo vinculado"}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs text-texto-secundario">{publicacao.textoPublicacao}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {aConferir.length > 0 && (
              <section>
                <TituloSecao
                  acao={
                    <Link href="/?filtro=conferir" className="normal-case tracking-normal font-medium text-accent">
                      Ver todos
                    </Link>
                  }
                >
                  A conferir · {aConferir.length}
                </TituloSecao>
                <ul className={`divide-y divide-slate-100 ${classePainel}`}>
                  {aConferir.slice(0, 5).map(({ prazo }) => (
                    <li key={prazo.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <Link href={`/prazos/${prazo.id}`} className="min-w-0 flex-1 hover:underline">
                        <span className="block truncate font-medium">{tituloPrazo(prazo).titulo}</span>
                        <span className="block truncate text-xs text-texto-secundario">
                          {prazo.processo.cliente.nome} · vence {formatarData(prazo.dataFinal)}
                        </span>
                      </Link>
                      <BotaoConfirmarPrazo prazoId={prazo.id} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <TituloSecao
                acao={
                  <Link href="/financeiro" className="normal-case tracking-normal font-medium text-accent">
                    Financeiro
                  </Link>
                }
              >
                Financeiro
              </TituloSecao>
              {parcelasAtrasadas.length === 0 && parcelasDoMes.length === 0 && alvarasAguardando.length === 0 ? (
                <p className="text-sm text-texto-secundario">Nada pendente.</p>
              ) : (
                <ul className={`divide-y divide-slate-100 text-sm ${classePainel}`}>
                  {parcelasAtrasadas.length > 0 && (
                    <li>
                      <Link href="/financeiro/honorarios" className="flex justify-between gap-3 px-3 py-2.5 hover:bg-fundo">
                        <span className="text-critico">
                          {parcelasAtrasadas.length} parcela{parcelasAtrasadas.length === 1 ? "" : "s"} em atraso
                        </span>
                        <span className="font-semibold tabular-nums text-critico">{formatarMoeda(soma(parcelasAtrasadas))}</span>
                      </Link>
                    </li>
                  )}
                  {parcelasDoMes.length > 0 && (
                    <li>
                      <Link href="/financeiro/honorarios" className="flex justify-between gap-3 px-3 py-2.5 hover:bg-fundo">
                        <span>A receber ainda este mês</span>
                        <span className="font-semibold tabular-nums">{formatarMoeda(soma(parcelasDoMes))}</span>
                      </Link>
                    </li>
                  )}
                  {alvarasAguardando.length > 0 && (
                    <li>
                      <Link href="/financeiro/alvaras" className="flex justify-between gap-3 px-3 py-2.5 hover:bg-fundo">
                        <span className="text-atencao">
                          Repassar a clientes ({alvarasAguardando.length} alvará{alvarasAguardando.length === 1 ? "" : "s"})
                        </span>
                        <span className="font-semibold tabular-nums text-atencao">{formatarMoeda(totalRepassar)}</span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

type ItemPrazo = {
  prazo: Parameters<typeof LinhaPrazo>[0]["prazo"] & { aConferir: boolean };
  dias: number;
  tier: ReturnType<typeof tierPorDiasRestantes>;
};

/** Lista de prazos aberta pelos números do topo (?filtro=…), agrupada por urgência. */
function ListaFiltrada({ filtro, prazos }: { filtro: Filtro; prazos: ItemPrazo[] }) {
  const visiveis = prazos.filter((p) => {
    if (filtro === "hoje") return p.dias <= 0;
    if (filtro === "semana") return p.dias >= 1 && p.dias <= 7;
    if (filtro === "conferir") return p.prazo.aConferir;
    return true;
  });
  const grupos = [
    { titulo: "Atrasados", itens: visiveis.filter((p) => p.dias < 0) },
    { titulo: "Hoje", itens: visiveis.filter((p) => p.dias === 0) },
    { titulo: "Próximos 7 dias", itens: visiveis.filter((p) => p.dias >= 1 && p.dias <= 7) },
    { titulo: "Depois", itens: visiveis.filter((p) => p.dias > 7) },
  ].filter((g) => g.itens.length > 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{TITULO_FILTRO[filtro]}</h2>
        <Link href="/" className="text-sm text-accent underline">
          Voltar ao resumo
        </Link>
      </div>
      {grupos.length === 0 ? (
        <EmptyState mensagem="Nenhum prazo neste filtro." acaoHref="/" acaoLabel="Voltar ao resumo" />
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <TituloSecao>
                {grupo.titulo} · {grupo.itens.length}
              </TituloSecao>
              <ul className={`divide-y divide-slate-100 overflow-hidden ${classePainel}`}>
                {grupo.itens.map(({ prazo, dias, tier }) => (
                  <LinhaPrazo key={prazo.id} prazo={prazo} dias={dias} tier={tier} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
