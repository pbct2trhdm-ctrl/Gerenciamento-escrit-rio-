import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_ORGAO_PROCESSO_ADMINISTRATIVO,
  LABEL_TIPO_PROCESSO_ADMINISTRATIVO,
  LABEL_STATUS_PROCESSO_ADMINISTRATIVO,
  LABEL_ORGAO_RECURSAL,
  LABEL_STATUS_RECURSO_ADMINISTRATIVO,
  LABEL_RESULTADO_RECURSO_ADMINISTRATIVO,
  LABEL_TIPO_ANDAMENTO,
  formatarData,
} from "@/lib/formatacao";
import { excluirProcessoAdministrativo } from "@/lib/actions/processos-administrativos";
import { excluirAndamento } from "@/lib/actions/andamentos";
import { excluirRecursoAdministrativo } from "@/lib/actions/recursos-administrativos";
import { tierStatus, tierResultadoRecurso } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeCard,
  classeBadgeNeutro,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function ProcessoAdministrativoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processoAdministrativo.findUnique({
    where: { id },
    include: {
      cliente: true,
      processoJudicial: { select: { id: true, numeroProcesso: true } },
      andamentos: { orderBy: { data: "desc" } },
      recursos: {
        orderBy: { dataInterposicao: "desc" },
        include: { andamentos: { orderBy: { data: "desc" } } },
      },
    },
  });

  if (!processo) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <LinkVoltar href="/processos-administrativos" label="Voltar para Processos Administrativos" />
      <div className="flex items-center justify-between mb-1">
        <h1 className={classeTituloPagina}>
          {processo.numeroProtocolo ?? "Sem protocolo"}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/processos-administrativos/${processo.id}/editar`}
            className={classeBotaoSecundario}
          >
            Editar
          </Link>
          <form action={excluirProcessoAdministrativo.bind(null, processo.id)}>
            <button type="submit" className={classeBotaoPerigo}>
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-texto-secundario mb-6 flex items-center gap-2 flex-wrap">
        <Link href={`/clientes/${processo.cliente.id}`} className="underline">
          {processo.cliente.nome}
        </Link>
        <span>· {LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}</span>
        <span>· {LABEL_TIPO_PROCESSO_ADMINISTRATIVO[processo.tipo]}</span>
        <Badge tier={tierStatus(processo.status)}>
          {LABEL_STATUS_PROCESSO_ADMINISTRATIVO[processo.status]}
        </Badge>
      </p>

      {processo.processoJudicial && (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span className="text-texto-principal">
            Este caso evoluiu para uma ação judicial:{" "}
          </span>
          <Link
            href={`/processos/${processo.processoJudicial.id}`}
            className="font-medium text-accent underline"
          >
            {processo.processoJudicial.numeroProcesso ?? "Processo sem número"}
          </Link>
        </div>
      )}

      <div className={`grid grid-cols-3 gap-4 mb-8 text-sm ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">Órgão</p>
          <p>{LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[processo.orgao]}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Tipo</p>
          <p>{LABEL_TIPO_PROCESSO_ADMINISTRATIVO[processo.tipo]}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Protocolo</p>
          <p>{processo.numeroProtocolo || "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Data de abertura</p>
          <p className="tabular-nums">{formatarData(processo.dataAbertura)}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Data da decisão</p>
          <p className="tabular-nums">
            {processo.dataDecisao ? formatarData(processo.dataDecisao) : "—"}
          </p>
        </div>
        <div>
          <p className="text-texto-secundario">Status</p>
          <p>{LABEL_STATUS_PROCESSO_ADMINISTRATIVO[processo.status]}</p>
        </div>
        <div className="col-span-3">
          <p className="text-texto-secundario">Resumo</p>
          <p className="whitespace-pre-wrap">{processo.resumo || "—"}</p>
        </div>
        {processo.observacoes && (
          <div className="col-span-3">
            <p className="text-texto-secundario">Observações</p>
            <p className="whitespace-pre-wrap">{processo.observacoes}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={classeTituloSecao}>Andamentos</h2>
          <Link
            href={`/processos-administrativos/${processo.id}/andamentos/novo`}
            className={classeBotaoPrimario}
          >
            Registrar andamento
          </Link>
        </div>

        {processo.andamentos.length === 0 ? (
          <EmptyState
            mensagem="Nenhum andamento registrado."
            acaoHref={`/processos-administrativos/${processo.id}/andamentos/novo`}
            acaoLabel="Registrar o primeiro andamento"
          />
        ) : (
          <ul className="space-y-3">
            {processo.andamentos.map((andamento) => (
              <li key={andamento.id}>
                <div className={`text-sm ${classeCard}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium tabular-nums">
                        {formatarData(andamento.data)}
                      </span>
                      <span className={classeBadgeNeutro}>
                        {LABEL_TIPO_ANDAMENTO[andamento.tipo]}
                      </span>
                    </div>
                    <form action={excluirAndamento.bind(null, andamento.id)}>
                      <button
                        type="submit"
                        className={`${classeBotaoPerigo} !px-2 !py-0.5 text-xs`}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{andamento.descricao}</p>
                  {andamento.arquivoCaminho && (
                    <a
                      href={`/anexos/${andamento.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-accent underline"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        className="w-4 h-4"
                      >
                        <path
                          d="M17 8.5 9.5 16a3 3 0 0 1-4.24-4.24L13 4a2 2 0 0 1 2.83 2.83l-7.42 7.42a1 1 0 0 1-1.41-1.42L14 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {andamento.arquivoNome ?? "Anexo"}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className={classeTituloSecao}>Recursos Administrativos</h2>
          <Link
            href={`/processos-administrativos/${processo.id}/recursos/novo`}
            className={classeBotaoPrimario}
          >
            Novo recurso
          </Link>
        </div>

        {processo.recursos.length === 0 ? (
          <EmptyState
            mensagem="Nenhum recurso administrativo registrado."
            acaoHref={`/processos-administrativos/${processo.id}/recursos/novo`}
            acaoLabel="Registrar o primeiro recurso"
          />
        ) : (
          <ul className="space-y-3">
            {processo.recursos.map((recurso) => (
              <li key={recurso.id}>
                <div className={`text-sm ${classeCard}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {LABEL_ORGAO_RECURSAL[recurso.orgaoRecursal]}
                      </span>
                      <Badge tier={tierStatus(recurso.status)}>
                        {LABEL_STATUS_RECURSO_ADMINISTRATIVO[recurso.status]}
                      </Badge>
                      {recurso.resultado && (
                        <Badge tier={tierResultadoRecurso(recurso.resultado)}>
                          {LABEL_RESULTADO_RECURSO_ADMINISTRATIVO[recurso.resultado]}
                        </Badge>
                      )}
                    </div>
                    <form action={excluirRecursoAdministrativo.bind(null, recurso.id)}>
                      <button
                        type="submit"
                        className={`${classeBotaoPerigo} !px-2 !py-0.5 text-xs`}
                      >
                        Excluir
                      </button>
                    </form>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-texto-secundario">
                    <p>
                      Interposto em{" "}
                      <span className="text-texto-principal tabular-nums">
                        {formatarData(recurso.dataInterposicao)}
                      </span>
                    </p>
                    {recurso.dataJulgamento && (
                      <p>
                        Julgado em{" "}
                        <span className="text-texto-principal tabular-nums">
                          {formatarData(recurso.dataJulgamento)}
                        </span>
                      </p>
                    )}
                  </div>

                  {recurso.observacoes && (
                    <p className="mt-2 whitespace-pre-wrap">{recurso.observacoes}</p>
                  )}

                  {recurso.andamentos.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2">
                      <p className="text-xs font-medium text-texto-secundario mb-1.5">
                        Andamentos deste recurso
                      </p>
                      <ul className="space-y-1">
                        {recurso.andamentos.map((andamento) => (
                          <li
                            key={andamento.id}
                            className="flex items-center gap-2 text-xs text-texto-secundario"
                          >
                            <span className="tabular-nums">{formatarData(andamento.data)}</span>
                            <span>·</span>
                            <span>{LABEL_TIPO_ANDAMENTO[andamento.tipo]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
