import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_PROCESSO,
  LABEL_GRAU_PROCESSO,
  LABEL_CONTAGEM,
  LABEL_STATUS_PRAZO,
  LABEL_TIPO_HONORARIO,
  LABEL_STATUS_SUCUMBENCIA,
  LABEL_STATUS_ALVARA,
  LABEL_JURISDICAO,
  LABEL_RITO,
  LABEL_MODALIDADE_AUDIENCIA,
  LABEL_TIPO_ANDAMENTO,
  LABEL_TIPO_RECURSO,
  LABEL_STATUS_RECURSO,
  LABEL_RESULTADO_RECURSO,
  formatarArea,
  formatarData,
  formatarDataHorario,
  formatarMoeda,
} from "@/lib/formatacao";
import { LABEL_TRIBUNAL } from "@/lib/tribunais";
import { diasRestantes } from "@/lib/prazos";
import { excluirProcesso } from "@/lib/actions/processos";
import { marcarPrazoComoCumprido } from "@/lib/actions/prazos";
import { excluirAndamento, registrarBaixaAutos } from "@/lib/actions/andamentos";
import { BotaoEnvio } from "@/components/botao-envio";
import { excluirRecurso } from "@/lib/actions/recursos";
import {
  tierPrazo,
  tierStatus,
  tierResultadoRecurso,
  CLASSE_BADGE_AUDIENCIA,
} from "@/lib/urgencia";
import { SeloPrazo } from "@/components/selo-prazo";
import { SeloAConferir } from "@/components/prazo-a-conferir";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import { SecaoAtualizacoesCliente } from "@/components/secao-atualizacoes-cliente";
import { AbasProcesso, type AbaProcesso } from "@/components/abas-processo";
import { MenuMaisAcoes } from "@/components/menu-mais-acoes";
import { tituloPrazo } from "@/lib/exibicao-prazo";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoPerigo,
  classeBotaoConfirma,
  classeCard,
  classeCardHover,
  classeBadgeNeutro,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

const ABAS = ["prazos", "andamentos", "atualizacoes", "recursos", "financeiro", "dados"] as const;

export default async function ProcessoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { id } = await params;
  const { aba: abaBruta } = await searchParams;
  const aba = (ABAS as readonly string[]).includes(abaBruta ?? "") ? abaBruta! : "prazos";

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      cliente: true,
      prazos: {
        orderBy: { dataFinal: "asc" },
        include: {
          origemAndamento: { select: { data: true } },
          _count: { select: { redesignacoes: true } },
        },
      },
      andamentos: {
        orderBy: { data: "desc" },
        include: { atualizacaoCliente: { select: { id: true } } },
      },
      recursos: {
        orderBy: { dataInterposicao: "desc" },
        include: { andamentos: { orderBy: { data: "desc" } } },
      },
      honorarios: { orderBy: { dataContrato: "desc" } },
      honorariosSucumbenciais: { orderBy: { criadoEm: "desc" } },
      alvaras: { orderBy: { criadoEm: "desc" } },
      atualizacoesCliente: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!processo) {
    notFound();
  }

  const andamentosComPrazoGerado = new Set(
    processo.prazos
      .map((prazo) => prazo.origemAndamentoId)
      .filter((idOrigem): idOrigem is string => idOrigem !== null)
  );

  const prazosPendentes = processo.prazos.filter((p) => p.status === "PENDENTE");
  const proximoPrazo = prazosPendentes[0];
  const abas: AbaProcesso[] = [
    { chave: "prazos", rotulo: "Prazos", total: prazosPendentes.length },
    { chave: "andamentos", rotulo: "Andamentos", total: processo.andamentos.length },
    { chave: "atualizacoes", rotulo: "Atualizações", total: processo.atualizacoesCliente.length },
    { chave: "recursos", rotulo: "Recursos", total: processo.recursos.length },
    {
      chave: "financeiro",
      rotulo: "Financeiro",
      total: processo.honorarios.length + processo.honorariosSucumbenciais.length + processo.alvaras.length,
    },
    { chave: "dados", rotulo: "Dados do processo" },
  ];

  return (
    <div className="max-w-6xl">
      <LinkVoltar href="/processos" label="Voltar para Processos" />
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className={classeTituloPagina}>
          {processo.numeroProcesso ?? "Processo sem número"}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/processos/${processo.id}/atualizacoes/nova`}
            className={classeBotaoPrimario}
          >
            Atualizar cliente
          </Link>
          <Link href={`/processos/${processo.id}/editar`} className={classeBotaoSecundario}>
            Editar
          </Link>
          <MenuMaisAcoes>
            <form action={excluirProcesso.bind(null, processo.id)}>
              <BotaoEnvio
                className={`${classeBotaoPerigo} w-full`}
                textoAguardando="Excluindo…"
                confirmacao="Excluir este processo com todos os prazos, andamentos e registros financeiros? Não dá para desfazer."
              >
                Excluir processo
              </BotaoEnvio>
            </form>
          </MenuMaisAcoes>
        </div>
      </div>
      <p className="text-texto-secundario mb-5 flex items-center gap-2 flex-wrap">
        <Link href={`/clientes/${processo.cliente.id}`} className="underline">
          {processo.cliente.nome}
        </Link>
        <span>· {formatarArea(processo.area, processo.areaOutraDescricao)}</span>
        {processo.tribunal && (
          <span>· {LABEL_TRIBUNAL[processo.tribunal]}</span>
        )}
        <Badge tier={tierStatus(processo.status)}>{LABEL_STATUS_PROCESSO[processo.status]}</Badge>
        <span className={classeBadgeNeutro}>{LABEL_GRAU_PROCESSO[processo.grau]}</span>
      </p>

      {processo.grau !== "PRIMEIRO_GRAU" && (
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span>
            Processo em <strong>{LABEL_GRAU_PROCESSO[processo.grau]}</strong>. Quando os autos
            voltarem, registre a baixa.
          </span>
          <form action={registrarBaixaAutos.bind(null, processo.id)}>
            <BotaoEnvio className={classeBotaoSecundario} textoAguardando="Registrando…">
              Registrar baixa ao 1º grau
            </BotaoEnvio>
          </form>
        </div>
      )}

      {proximoPrazo && (
        <Link
          href={`/prazos/${proximoPrazo.id}`}
          className={`mb-5 flex items-center gap-3 ${classeCardHover} !py-3`}
        >
          <SeloPrazo
            id={`proximo-${proximoPrazo.id}`}
            dias={diasRestantes(proximoPrazo.dataFinal)}
            tier={tierPrazo(proximoPrazo.status, diasRestantes(proximoPrazo.dataFinal))}
            size={44}
          />
          <span className="min-w-0 flex-1 text-sm">
            <span className="text-texto-secundario">Próximo prazo: </span>
            <span className="font-semibold">{tituloPrazo(proximoPrazo).titulo}</span>
            <span className="text-texto-secundario">
              {" · "}
              {proximoPrazo.tipo === "AUDIENCIA"
                ? formatarDataHorario(proximoPrazo.dataFinal)
                : formatarData(proximoPrazo.dataFinal)}
            </span>
          </span>
          {proximoPrazo.aConferir && <SeloAConferir />}
        </Link>
      )}

      <AbasProcesso processoId={processo.id} abaAtual={aba} abas={abas} />

      {aba === "prazos" && (
        <>
      <div className="flex items-center justify-between mb-3">
        <h2 className={classeTituloSecao}>Prazos vinculados</h2>
        <Link href={`/prazos/novo?processoId=${processo.id}`} className={classeBotaoSecundario}>
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
                  className={`rounded-xl border bg-superficie p-4 shadow-xs ${
                    tier === "critico" && prazo.status === "PENDENTE"
                      ? "border-critico/30"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <SeloPrazo id={prazo.id} dias={restantes} tier={tier} status={prazo.status} size={64} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{tituloPrazo(prazo).titulo}</p>
                        {prazo.tipo === "AUDIENCIA" && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSE_BADGE_AUDIENCIA}`}
                          >
                            Audiência
                          </span>
                        )}
                        {prazo.aConferir && <SeloAConferir />}
                        {prazo._count.redesignacoes > 0 && (
                          <span className={classeBadgeNeutro}>
                            Redesignada {prazo._count.redesignacoes}x
                          </span>
                        )}
                      </div>
                      {prazo.tipo === "AUDIENCIA" && prazo.modalidadeAudiencia && (
                        <p className="text-sm text-texto-secundario">
                          {LABEL_MODALIDADE_AUDIENCIA[prazo.modalidadeAudiencia]}
                        </p>
                      )}
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
                  {prazo.tipo === "AUDIENCIA" && (prazo.linkAudiencia || prazo.contatoVaraAudiencia) && (
                    <div className="mt-3 text-sm space-y-1">
                      {prazo.linkAudiencia && (
                        <p>
                          <span className="text-texto-secundario">Link: </span>
                          <a
                            href={prazo.linkAudiencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline break-all"
                          >
                            {prazo.linkAudiencia}
                          </a>
                        </p>
                      )}
                      {prazo.contatoVaraAudiencia && (
                        <p>
                          <span className="text-texto-secundario">
                            Contato da vara (solicitar link):{" "}
                          </span>
                          {prazo.contatoVaraAudiencia}
                        </p>
                      )}
                    </div>
                  )}
                  {prazo.origemAndamento && (
                    <p className="mt-2 text-xs text-texto-secundario italic">
                      Gerado a partir de andamento de {formatarData(prazo.origemAndamento.data)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/prazos/${prazo.id}`}
                      className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                    >
                      Detalhes
                    </Link>
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
        </>
      )}

      {aba === "andamentos" && (
        <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={classeTituloSecao}>Andamentos</h2>
          <Link
            href={`/processos/${processo.id}/andamentos/novo`}
            className={classeBotaoSecundario}
          >
            Registrar andamento
          </Link>
        </div>

        {processo.andamentos.length === 0 ? (
          <EmptyState
            mensagem="Nenhum andamento registrado."
            acaoHref={`/processos/${processo.id}/andamentos/novo`}
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
                      {andamentosComPrazoGerado.has(andamento.id) && (
                        <span className={classeBadgeNeutro}>Prazo gerado</span>
                      )}
                      {andamento.atualizacaoCliente && (
                        <Link
                          href={`/processos/${processo.id}/atualizacoes/${andamento.atualizacaoCliente.id}`}
                          className={`${classeBadgeNeutro} hover:text-accent`}
                        >
                          Cliente atualizado
                        </Link>
                      )}
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
        </>
      )}

      {aba === "atualizacoes" && (
        <>
      <SecaoAtualizacoesCliente
        className=""
        caminhoProcesso={`/processos/${processo.id}`}
        atualizacoes={processo.atualizacoesCliente}
      />
        </>
      )}

      {aba === "recursos" && (
        <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={classeTituloSecao}>Recursos</h2>
          <Link
            href={`/processos/${processo.id}/recursos/novo`}
            className={classeBotaoSecundario}
          >
            Novo recurso
          </Link>
        </div>

        {processo.recursos.length === 0 ? (
          <EmptyState
            mensagem="Nenhum recurso registrado."
            acaoHref={`/processos/${processo.id}/recursos/novo`}
            acaoLabel="Registrar o primeiro recurso"
          />
        ) : (
          <ul className="space-y-3">
            {processo.recursos.map((recurso) => (
              <li key={recurso.id}>
                <div className={`text-sm ${classeCard}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{LABEL_TIPO_RECURSO[recurso.tipoRecurso]}</span>
                      <Badge tier={tierStatus(recurso.status)}>
                        {LABEL_STATUS_RECURSO[recurso.status]}
                      </Badge>
                      {recurso.resultado && (
                        <Badge tier={tierResultadoRecurso(recurso.resultado)}>
                          {LABEL_RESULTADO_RECURSO[recurso.resultado]}
                        </Badge>
                      )}
                    </div>
                    <form action={excluirRecurso.bind(null, recurso.id)}>
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
                    {recurso.tribunal2Grau && (
                      <p>
                        Tribunal:{" "}
                        <span className="text-texto-principal">
                          {LABEL_TRIBUNAL[recurso.tribunal2Grau]}
                        </span>
                      </p>
                    )}
                    {recurso.orgaoJulgador && (
                      <p>
                        Órgão julgador:{" "}
                        <span className="text-texto-principal">{recurso.orgaoJulgador}</span>
                      </p>
                    )}
                    {recurso.relator && (
                      <p>
                        Relator: <span className="text-texto-principal">{recurso.relator}</span>
                      </p>
                    )}
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
        </>
      )}

      {aba === "financeiro" && (
        <>
      <div className="space-y-8">
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
        </>
      )}

      {aba === "dados" && (
        <>
      <dl className={`grid grid-cols-1 gap-4 text-sm sm:grid-cols-3 ${classeCard}`}>
        {[
          ["Tribunal", processo.tribunal ? LABEL_TRIBUNAL[processo.tribunal] : null],
          ["Vara", processo.vara],
          ["Comarca", processo.comarca],
          ["Grau", LABEL_GRAU_PROCESSO[processo.grau]],
          ["Jurisdição", processo.jurisdicao ? LABEL_JURISDICAO[processo.jurisdicao] : null],
          ["Rito", processo.rito ? LABEL_RITO[processo.rito] : null],
          [
            "Cliente no",
            processo.poloCliente === "ATIVO"
              ? "Polo ativo"
              : processo.poloCliente === "PASSIVO"
                ? "Polo passivo"
                : "Não informado",
          ],
          ["Criado em", formatarData(processo.criadoEm)],
        ]
          // Campos vazios ficam ocultos; "Editar" mostra todos.
          .filter(([, valor]) => valor)
          .map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-texto-secundario">{rotulo}</dt>
              <dd className="tabular-nums">{valor}</dd>
            </div>
          ))}
        {processo.resumo && (
          <div className="sm:col-span-3">
            <dt className="text-texto-secundario">Resumo</dt>
            <dd className="whitespace-pre-wrap">{processo.resumo}</dd>
          </div>
        )}
      </dl>
        </>
      )}

    </div>
  );
}
