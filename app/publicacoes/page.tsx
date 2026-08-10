import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_STATUS_VINCULO_PUBLICACAO, formatarData } from "@/lib/formatacao";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { VincularPublicacaoForm } from "@/components/vincular-publicacao-form";
import { vincularPublicacaoManualmente } from "@/lib/actions/publicacoes";
import { classeCard, classeBadgeNeutro, classeTituloPagina } from "@/lib/estilos";
import type { Prisma } from "@/app/generated/prisma/client";

function trechoTexto(texto: string, tamanho = 220): string {
  return texto.length > tamanho ? `${texto.slice(0, tamanho)}…` : texto;
}

export default async function PublicacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const abaAtiva = aba === "vinculadas" || aba === "orfas" ? aba : "";

  const where: Prisma.PublicacaoWhereInput =
    abaAtiva === "vinculadas"
      ? { statusVinculo: "VINCULADA" }
      : abaAtiva === "orfas"
        ? { statusVinculo: "ORFA" }
        : {};

  const [publicacoes, totalTodas, totalVinculadas, totalOrfas, processos] = await Promise.all([
    prisma.publicacao.findMany({
      where,
      orderBy: { dataPublicacao: "desc" },
      include: { processo: { include: { cliente: true } } },
    }),
    prisma.publicacao.count(),
    prisma.publicacao.count({ where: { statusVinculo: "VINCULADA" } }),
    prisma.publicacao.count({ where: { statusVinculo: "ORFA" } }),
    prisma.processo.findMany({
      orderBy: { criadoEm: "desc" },
      select: { id: true, numeroProcesso: true, cliente: { select: { nome: true } } },
    }),
  ]);

  const segmentos = [
    { valor: "", label: "Todas", contagem: totalTodas },
    { valor: "vinculadas", label: "Vinculadas", contagem: totalVinculadas },
    { valor: "orfas", label: "Órfãs", contagem: totalOrfas },
  ] as const;

  return (
    <div className="max-w-4xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Publicações</h1>

      <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-superficie p-1 mb-6">
        {segmentos.map((segmento) => {
          const ativo = segmento.valor === abaAtiva;
          const href = segmento.valor
            ? `/publicacoes?aba=${segmento.valor}`
            : "/publicacoes";
          return (
            <Link
              key={segmento.valor || "todas"}
              href={href}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-base-escura text-white"
                  : "text-texto-secundario hover:bg-fundo hover:text-texto-principal"
              }`}
            >
              {segmento.label} ({segmento.contagem})
            </Link>
          );
        })}
      </div>

      {publicacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma publicação encontrada." />
      ) : (
        <ul className="space-y-3">
          {publicacoes.map((publicacao) => (
            <li key={publicacao.id}>
              <div className={`text-sm ${classeCard}`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/publicacoes/${publicacao.id}`}
                      className="font-medium hover:underline tabular-nums"
                    >
                      {formatarData(publicacao.dataPublicacao)}
                    </Link>
                    <span className={classeBadgeNeutro}>{publicacao.tribunalOrgao}</span>
                    <Badge tier={tierStatus(publicacao.statusVinculo)}>
                      {LABEL_STATUS_VINCULO_PUBLICACAO[publicacao.statusVinculo]}
                    </Badge>
                    {!publicacao.lida && (
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
                        Não lida
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-texto-secundario">
                  {trechoTexto(publicacao.textoPublicacao)}
                </p>

                {publicacao.processo ? (
                  <p className="mt-2">
                    <Link
                      href={`/processos/${publicacao.processo.id}`}
                      className="text-accent underline"
                    >
                      {publicacao.processo.cliente.nome} ·{" "}
                      {publicacao.processo.numeroProcesso ?? "sem número"}
                    </Link>
                  </p>
                ) : (
                  <div className="mt-3">
                    <VincularPublicacaoForm
                      processos={processos}
                      action={vincularPublicacaoManualmente.bind(null, publicacao.id)}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
