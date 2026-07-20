import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_PROCESSO,
  LABEL_TIPO_PRAZO,
  LABEL_CONTAGEM,
  LABEL_STATUS_PRAZO,
  LABEL_TIPO_HONORARIO,
  LABEL_STATUS_SUCUMBENCIA,
  LABEL_STATUS_ALVARA,
  formatarArea,
  formatarData,
  formatarDataHorario,
  formatarMoeda,
} from "@/lib/formatacao";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";
import { diasRestantes } from "@/lib/prazos";
import { excluirProcesso } from "@/lib/actions/processos";
import { marcarPrazoComoCumprido } from "@/lib/actions/prazos";
import { tierPrazo, tierStatus, CLASSE_BADGE_AUDIENCIA } from "@/lib/urgencia";
import { SeloPrazo } from "@/components/selo-prazo";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeBotaoConfirma,
  classeCard,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      cliente: true,
      prazos: { orderBy: { dataFinal: "asc" } },
      honorarios: { orderBy: { dataContrato: "desc" } },
      honorariosSucumbenciais: { orderBy: { criadoEm: "desc" } },
      alvaras: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!processo) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <LinkVoltar href="/processos" label="Voltar para Processos" />
      <div className="flex items-center justify-between mb-1">
        <h1 className={classeTituloPagina}>
          {processo.numeroProcesso ?? "Processo sem número"}
        </h1>
        <div className="flex gap-2">
          <Link href={`/processos/${processo.id}/editar`} className={classeBotaoSecundario}>
            Editar
          </Link>
          <form action={excluirProcesso.bind(null, processo.id)}>
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
        <span>· {formatarArea(processo.area, processo.areaOutraDescricao)}</span>
        {processo.tribunal && (
          <span>· {LABEL_TRIBUNAL[processo.tribunal]}</span>
        )}
        <Badge tier={tierStatus(processo.status)}>{LABEL_STATUS_PROCESSO[processo.status]}</Badge>
      </p>

      <div className={`grid grid-cols-2 gap-4 mb-8 text-sm ${classeCard}`}>
        <div>
          <p className="text-texto-secundario">Tribunal</p>
          <p>{processo.tribunal ? LABEL_TRIBUNAL[processo.tribunal] : "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Criado em</p>
          <p className="tabular-nums">{formatarData(processo.criadoEm)}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Vara</p>
          <p>{processo.vara || "—"}</p>
        </div>
        <div>
          <p className="text-texto-secundario">Comarca</p>
          <p>{processo.comarca || "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-texto-secundario">Resumo</p>
          <p className="whitespace-pre-wrap">{processo.resumo || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className={classeTituloSecao}>Prazos vinculados</h2>
        <Link href={`/prazos/novo?processoId=${processo.id}`} className={classeBotaoPrimario}>
          Novo prazo
        </Link>
      </div>

      {processo.prazos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum prazo vinculado."
          acaoHref={`/prazos/novo?processoId=${processo.id}`}
          acaoLabel="Adicionar o primeiro prazo"
        />
      ) : (
        <ul className="space-y-3">
          {processo.prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const tier = tierPrazo(prazo.status, restantes);
            return (
              <li key={prazo.id}>
                <div
                  className={`rounded-lg border bg-superficie p-4 ${
                    tier === "critico" && prazo.status === "PENDENTE"
                      ? "border-critico/30"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <SeloPrazo id={prazo.id} dias={restantes} tier={tier} size={64} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{LABEL_TIPO_PRAZO[prazo.tipo]}</p>
                        {prazo.tipo === "AUDIENCIA" && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSE_BADGE_AUDIENCIA}`}
                          >
                            Audiência
                          </span>
                        )}
                      </div>
                      {prazo.tipo !== "AUDIENCIA" &&
                        prazo.dataBase &&
                        prazo.dias != null &&
                        prazo.contagem && (
                          <p className="text-sm text-texto-secundario tabular-nums">
                            {formatarData(prazo.dataBase)} + {prazo.dias} dia(s) (
                            {LABEL_CONTAGEM[prazo.contagem]})
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {prazo.tipo === "AUDIENCIA"
                          ? formatarDataHorario(prazo.dataFinal)
                          : formatarData(prazo.dataFinal)}
                      </p>
                      <div className="mt-1">
                        <Badge tier={tier}>{LABEL_STATUS_PRAZO[prazo.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/prazos/${prazo.id}/editar`}
                      className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                    >
                      Editar
                    </Link>
                    {prazo.status === "PENDENTE" && (
                      <form action={marcarPrazoComoCumprido.bind(null, prazo.id)}>
                        <button
                          type="submit"
                          className={`${classeBotaoConfirma} !px-3 !py-1 text-xs`}
                        >
                          Marcar como cumprido
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={classeTituloSecao}>Honorários contratuais</h2>
            <Link
              href={`/financeiro/honorarios/novo?processoId=${processo.id}`}
              className={classeBotaoSecundario}
            >
              Novo honorário
            </Link>
          </div>
          {processo.honorarios.length === 0 ? (
            <p className="text-texto-secundario text-sm">Nenhum honorário cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.honorarios.map((honorario) => (
                <li key={honorario.id}>
                  <Link
                    href={`/financeiro/honorarios/${honorario.id}`}
                    className={`flex items-center justify-between text-sm ${classeCard} hover:bg-fundo transition-colors`}
                  >
                    <span>{LABEL_TIPO_HONORARIO[honorario.tipo]}</span>
                    <span className="tabular-nums font-medium">
                      {honorario.valorTotal != null
                        ? formatarMoeda(honorario.valorTotal)
                        : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={classeTituloSecao}>Sucumbência</h2>
            <Link
              href={`/financeiro/sucumbencia/novo?processoId=${processo.id}`}
              className={classeBotaoSecundario}
            >
              Nova sucumbência
            </Link>
          </div>
          {processo.honorariosSucumbenciais.length === 0 ? (
            <p className="text-texto-secundario text-sm">Nenhum registro cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.honorariosSucumbenciais.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/financeiro/sucumbencia/${s.id}/editar`}
                    className={`flex items-center justify-between text-sm ${classeCard} hover:bg-fundo transition-colors`}
                  >
                    <Badge tier={tierStatus(s.status)}>{LABEL_STATUS_SUCUMBENCIA[s.status]}</Badge>
                    <span className="tabular-nums font-medium">
                      {s.valorDefinido != null
                        ? formatarMoeda(s.valorDefinido)
                        : s.valorEstimado != null
                          ? `~ ${formatarMoeda(s.valorEstimado)}`
                          : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={classeTituloSecao}>Alvarás</h2>
            <Link
              href={`/financeiro/alvaras/novo?processoId=${processo.id}`}
              className={classeBotaoSecundario}
            >
              Novo alvará
            </Link>
          </div>
          {processo.alvaras.length === 0 ? (
            <p className="text-texto-secundario text-sm">Nenhum alvará cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.alvaras.map((alvara) => (
                <li key={alvara.id}>
                  <Link
                    href={`/financeiro/alvaras/${alvara.id}/editar`}
                    className={`flex items-center justify-between text-sm ${classeCard} hover:bg-fundo transition-colors`}
                  >
                    <Badge tier={tierStatus(alvara.status)}>{LABEL_STATUS_ALVARA[alvara.status]}</Badge>
                    <span className="tabular-nums font-medium">
                      {formatarMoeda(alvara.valorTotal)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
