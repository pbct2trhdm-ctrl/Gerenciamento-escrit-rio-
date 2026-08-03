import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_TIPO_PRAZO,
  LABEL_STATUS_PRAZO,
  LABEL_CONTAGEM,
  LABEL_MODALIDADE_AUDIENCIA,
  formatarData,
  formatarDataHorario,
} from "@/lib/formatacao";
import { diasRestantes } from "@/lib/prazos";
import { excluirPrazo, marcarPrazoComoCumprido } from "@/lib/actions/prazos";
import { tierPrazo } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeBotaoConfirma,
  classeCard,
  classeBadgeNeutro,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function PrazoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const prazo = await prisma.prazo.findUnique({
    where: { id },
    include: {
      processo: { include: { cliente: true } },
      redesignacoes: { orderBy: { dataRegistro: "asc" } },
    },
  });

  if (!prazo) {
    notFound();
  }

  const ehAudiencia = prazo.tipo === "AUDIENCIA";
  const restantes = diasRestantes(prazo.dataFinal);
  const tier = tierPrazo(prazo.status, restantes);

  return (
    <div className="max-w-3xl">
      <LinkVoltar href="/prazos" label="Voltar para Prazos/Agenda" />
      <div className="flex items-center justify-between mb-1">
        <h1 className={classeTituloPagina}>{LABEL_TIPO_PRAZO[prazo.tipo]}</h1>
        <div className="flex gap-2">
          <Link href={`/prazos/${prazo.id}/editar`} className={classeBotaoSecundario}>
            Editar
          </Link>
          <form action={excluirPrazo.bind(null, prazo.id)}>
            <button type="submit" className={classeBotaoPerigo}>
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-texto-secundario mb-6 flex items-center gap-2 flex-wrap">
        <Link href={`/processos/${prazo.processo.id}`} className="underline">
          {prazo.processo.cliente.nome} · {prazo.processo.numeroProcesso ?? "Sem número"}
        </Link>
        <Badge tier={tier}>{LABEL_STATUS_PRAZO[prazo.status]}</Badge>
        {prazo.redesignacoes.length > 0 && (
          <span className={classeBadgeNeutro}>
            Redesignada {prazo.redesignacoes.length}x
          </span>
        )}
      </p>

      <div className={`grid grid-cols-2 gap-4 mb-6 text-sm ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">Tipo</p>
          <p>{LABEL_TIPO_PRAZO[prazo.tipo]}</p>
        </div>
        <div>
          <p className="text-texto-secundario">
            {ehAudiencia ? "Data e horário" : "Data final"}
          </p>
          <p className="tabular-nums">
            {ehAudiencia ? formatarDataHorario(prazo.dataFinal) : formatarData(prazo.dataFinal)}
          </p>
        </div>
        {ehAudiencia ? (
          <>
            <div>
              <p className="text-texto-secundario">Modalidade</p>
              <p>
                {prazo.modalidadeAudiencia
                  ? LABEL_MODALIDADE_AUDIENCIA[prazo.modalidadeAudiencia]
                  : "—"}
              </p>
            </div>
            {prazo.linkAudiencia && (
              <div>
                <p className="text-texto-secundario">Link</p>
                <a
                  href={prazo.linkAudiencia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline break-all"
                >
                  {prazo.linkAudiencia}
                </a>
              </div>
            )}
            {prazo.contatoVaraAudiencia && (
              <div>
                <p className="text-texto-secundario">Contato da vara</p>
                <p>{prazo.contatoVaraAudiencia}</p>
              </div>
            )}
          </>
        ) : (
          prazo.dataBase &&
          prazo.dias != null &&
          prazo.contagem && (
            <div>
              <p className="text-texto-secundario">Cálculo</p>
              <p className="tabular-nums">
                {formatarData(prazo.dataBase)} + {prazo.dias} dia(s) (
                {LABEL_CONTAGEM[prazo.contagem]})
              </p>
            </div>
          )
        )}
        {prazo.observacoes && (
          <div className="col-span-2">
            <p className="text-texto-secundario">Observações</p>
            <p className="whitespace-pre-wrap">{prazo.observacoes}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8">
        {ehAudiencia && (
          <Link href={`/prazos/${prazo.id}/redesignar`} className={classeBotaoPrimario}>
            Redesignar audiência
          </Link>
        )}
        {prazo.status === "PENDENTE" && (
          <form action={marcarPrazoComoCumprido.bind(null, prazo.id)}>
            <button type="submit" className={classeBotaoConfirma}>
              Marcar como cumprido
            </button>
          </form>
        )}
      </div>

      {ehAudiencia && (
        <div>
          <h2 className={`${classeTituloSecao} mb-3`}>Histórico de redesignações</h2>
          {prazo.redesignacoes.length === 0 ? (
            <EmptyState mensagem="Nenhuma redesignação registrada." />
          ) : (
            <ul className="space-y-3">
              {prazo.redesignacoes.map((redesignacao) => (
                <li key={redesignacao.id}>
                  <div className={`text-sm ${classeCard}`}>
                    <p className="font-medium tabular-nums">
                      {formatarDataHorario(redesignacao.dataAnterior)} →{" "}
                      {formatarDataHorario(redesignacao.dataNova)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{redesignacao.motivo}</p>
                    <p className="mt-2 text-xs text-texto-secundario">
                      Registrado em {formatarData(redesignacao.dataRegistro)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
