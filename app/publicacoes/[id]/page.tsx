import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LABEL_STATUS_VINCULO_PUBLICACAO, formatarData } from "@/lib/formatacao";
import { marcarPublicacaoComoLida } from "@/lib/publicacoes";
import { vincularPublicacaoManualmente } from "@/lib/actions/publicacoes";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { VincularPublicacaoForm } from "@/components/vincular-publicacao-form";
import { LinkVoltar } from "@/components/link-voltar";
import { classeCard, classeTituloPagina } from "@/lib/estilos";

export default async function PublicacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const publicacao = await prisma.publicacao.findUnique({
    where: { id },
    include: { processo: { include: { cliente: true } } },
  });

  if (!publicacao) {
    notFound();
  }

  await marcarPublicacaoComoLida(id);

  const processos = publicacao.processoId
    ? []
    : await prisma.processo.findMany({
        orderBy: { criadoEm: "desc" },
        select: { id: true, numeroProcesso: true, cliente: { select: { nome: true } } },
      });

  return (
    <div className="max-w-3xl">
      <LinkVoltar href="/publicacoes" label="Voltar para Publicações" />
      <div className="flex items-center justify-between mb-1">
        <h1 className={classeTituloPagina}>{publicacao.tribunalOrgao}</h1>
        <Badge tier={tierStatus(publicacao.statusVinculo)}>
          {LABEL_STATUS_VINCULO_PUBLICACAO[publicacao.statusVinculo]}
        </Badge>
      </div>
      <p className="text-texto-secundario mb-6 tabular-nums">
        {formatarData(publicacao.dataPublicacao)}
      </p>

      <div className={`text-sm space-y-4 mb-6 ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">Número de processo identificado</p>
          <p className="tabular-nums">{publicacao.numeroProcessoIdentificado ?? "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Texto da publicação</p>
          <p className="whitespace-pre-wrap">{publicacao.textoPublicacao}</p>
        </div>
      </div>

      {publicacao.processo ? (
        <p className="text-sm">
          Vinculada ao processo:{" "}
          <Link href={`/processos/${publicacao.processo.id}`} className="text-accent underline">
            {publicacao.processo.cliente.nome} ·{" "}
            {publicacao.processo.numeroProcesso ?? "sem número"}
          </Link>
        </p>
      ) : (
        <div>
          <p className="text-sm text-texto-secundario mb-2">
            Nenhum processo cadastrado corresponde ao número identificado nesta publicação.
          </p>
          <VincularPublicacaoForm
            processos={processos}
            action={vincularPublicacaoManualmente.bind(null, publicacao.id)}
          />
        </div>
      )}
    </div>
  );
}
