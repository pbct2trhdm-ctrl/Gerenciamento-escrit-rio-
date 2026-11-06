import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { diasRestantes } from "@/lib/prazos";
import { formatarData } from "@/lib/formatacao";
import { tierPorDiasRestantes } from "@/lib/urgencia";
import { LinhaPrazo } from "@/components/linha-prazo";
import { EmptyState } from "@/components/empty-state";
import { classeTituloPagina } from "@/lib/estilos";

const FILTROS = ["hoje", "semana", "audiencias", "conferir"] as const;
type Filtro = (typeof FILTROS)[number];

const DATA_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Belem",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro: filtroBruto } = await searchParams;
  const filtro = (FILTROS as readonly string[]).includes(filtroBruto ?? "") ? (filtroBruto as Filtro) : null;

  const [prazosPendentes, publicacoesNaoLidas, publicacoesPrazoADefinir] = await Promise.all([
    prisma.prazo.findMany({
      where: { status: "PENDENTE" },
      orderBy: { dataFinal: "asc" },
      include: { processo: { include: { cliente: true } } },
    }),
    prisma.publicacao.count({ where: { lida: false } }),
    prisma.publicacao.findMany({
      where: { prazoADefinir: true },
      orderBy: { dataPublicacao: "asc" },
      include: { processo: { include: { cliente: true } } },
    }),
  ]);

  const prazos = prazosPendentes.map((prazo) => {
    const dias = diasRestantes(prazo.dataFinal);
    return { prazo, dias, tier: tierPorDiasRestantes(dias) };
  });

  const contagem = {
    hoje: prazos.filter((p) => p.dias <= 0).length,
    semana: prazos.filter((p) => p.dias >= 1 && p.dias <= 7).length,
    audiencias: prazos.filter((p) => p.prazo.tipo === "AUDIENCIA" && p.dias >= 0).length,
    conferir: prazos.filter((p) => p.prazo.aConferir).length,
  };

  const visiveis = prazos.filter((p) => {
    if (filtro === "hoje") return p.dias <= 0;
    if (filtro === "semana") return p.dias >= 1 && p.dias <= 7;
    if (filtro === "audiencias") return p.prazo.tipo === "AUDIENCIA" && p.dias >= 0;
    if (filtro === "conferir") return p.prazo.aConferir;
    return true;
  });

  const grupos = [
    { titulo: "Atrasados", itens: visiveis.filter((p) => p.dias < 0) },
    { titulo: "Hoje", itens: visiveis.filter((p) => p.dias === 0) },
    { titulo: "Esta semana", itens: visiveis.filter((p) => p.dias >= 1 && p.dias <= 7) },
    { titulo: "Depois", itens: visiveis.filter((p) => p.dias > 7) },
  ].filter((g) => g.itens.length > 0);

  const indicadores: { chave: Filtro | "publicacoes"; rotulo: string; total: number; cor: string; href: string }[] = [
    { chave: "hoje", rotulo: prazos.some((p) => p.dias < 0) ? "hoje ou atrasados" : "vencem hoje", total: contagem.hoje, cor: "text-critico", href: "/?filtro=hoje" },
    { chave: "semana", rotulo: "esta semana", total: contagem.semana, cor: "text-atencao", href: "/?filtro=semana" },
    { chave: "audiencias", rotulo: "audiências", total: contagem.audiencias, cor: "text-audiencia", href: "/?filtro=audiencias" },
    { chave: "conferir", rotulo: "a conferir", total: contagem.conferir, cor: "text-texto-principal", href: "/?filtro=conferir" },
    { chave: "publicacoes", rotulo: "publicações novas", total: publicacoesNaoLidas, cor: "text-accent", href: "/publicacoes" },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className={classeTituloPagina}>Dashboard</h1>
      <p className="mb-6 text-texto-secundario first-letter:uppercase">{DATA_EXTENSO.format(new Date())}</p>

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
                <span className={`font-display text-2xl sm:text-3xl font-semibold leading-none tabular-nums ${item.total > 0 ? item.cor : "text-texto-secundario/50"}`}>
                  {item.total}
                </span>
                <span className="mt-1 text-[11px] leading-tight text-texto-secundario sm:mt-1.5 sm:text-sm">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {publicacoesPrazoADefinir.length > 0 && (
        <div className="mb-6 rounded-lg border border-atencao/40 bg-atencao-fundo px-4 py-3 text-sm">
          <p className="font-semibold text-atencao">
            {publicacoesPrazoADefinir.length} publicaç
            {publicacoesPrazoADefinir.length === 1 ? "ão" : "ões"} sem prazo identificado — defina o prazo
          </p>
          <ul className="mt-2 space-y-1">
            {publicacoesPrazoADefinir.map((publicacao) => (
              <li key={publicacao.id}>
                <Link href={`/publicacoes/${publicacao.id}`} className="text-atencao underline">
                  {formatarData(publicacao.dataPublicacao)} · {publicacao.processo?.cliente.nome ?? "—"} ·{" "}
                  {publicacao.processo?.numeroProcesso ?? "sem número"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filtro && (
        <p className="mb-4 text-sm text-texto-secundario">
          Mostrando só {indicadores.find((i) => i.chave === filtro)?.rotulo}.{" "}
          <Link href="/" className="text-accent underline">
            Mostrar todos os prazos
          </Link>
        </p>
      )}

      {prazos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum prazo pendente cadastrado."
          acaoHref="/prazos/novo"
          acaoLabel="Adicionar o primeiro prazo"
        />
      ) : grupos.length === 0 ? (
        <EmptyState mensagem="Nenhum prazo neste filtro." acaoHref="/" acaoLabel="Mostrar todos" />
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => {
            const lista = (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-superficie shadow-xs">
                {grupo.itens.map(({ prazo, dias, tier }) => (
                  <LinhaPrazo key={prazo.id} prazo={prazo} dias={dias} tier={tier} />
                ))}
              </ul>
            );
            const cabecalho = (
              <>
                <span>{grupo.titulo}</span>
                <span className="rounded-full bg-slate-200/70 px-2 text-xs font-semibold text-texto-secundario">
                  {grupo.itens.length}
                </span>
                <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
              </>
            );
            const classeCabecalho =
              "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-texto-secundario";

            // "Depois" começa recolhido quando há prazos mais próximos para ver.
            if (grupo.titulo === "Depois" && grupos.length > 1) {
              return (
                <details key={grupo.titulo} className="group">
                  <summary className={`${classeCabecalho} cursor-pointer list-none`}>
                    {cabecalho}
                    <span className="normal-case tracking-normal font-medium text-accent group-open:hidden">mostrar</span>
                    <span className="hidden normal-case tracking-normal font-medium text-accent group-open:inline">ocultar</span>
                  </summary>
                  {lista}
                </details>
              );
            }
            return (
              <section key={grupo.titulo}>
                <h2 className={classeCabecalho}>{cabecalho}</h2>
                {lista}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
