import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_STATUS_VINCULO_PUBLICACAO,
  LABEL_TIPO_PRAZO,
  LABEL_CONTAGEM,
  formatarData,
} from "@/lib/formatacao";
import { marcarPublicacaoComoLida } from "@/lib/publicacoes";
import {
  vincularPublicacaoManualmente,
  definirPrazoDaPublicacao,
  marcarPublicacaoSemPrazo,
} from "@/lib/actions/publicacoes";
import { dataPublicacaoEfetiva } from "@/lib/prazo-publicacao";
import { SeloAConferir, BotaoConfirmarPrazo } from "@/components/prazo-a-conferir";
import { BotaoEnvio } from "@/components/botao-envio";
import { tierStatus } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { VincularPublicacaoForm } from "@/components/vincular-publicacao-form";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeCard,
  classeTituloPagina,
  classeTituloSecao,
  classeInput,
  classeLabel,
  classeBotaoPrimario,
  classeBotaoSecundario,
} from "@/lib/estilos";

export default async function PublicacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const publicacao = await prisma.publicacao.findUnique({
    where: { id },
    include: {
      processo: { include: { cliente: true } },
      prazos: { orderBy: { dataFinal: "asc" } },
    },
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

      {publicacao.processo && (
        <div className="mb-6">
          <h2 className={`${classeTituloSecao} mb-3`}>Prazo</h2>
          {publicacao.prazos.length > 0 ? (
            <ul className="space-y-2">
              {publicacao.prazos.map((prazo) => (
                <li key={prazo.id} className={`text-sm ${classeCard}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/prazos/${prazo.id}`} className="font-medium text-accent underline">
                        {LABEL_TIPO_PRAZO[prazo.tipo]} · vence em {formatarData(prazo.dataFinal)}
                      </Link>
                      {prazo.aConferir && <SeloAConferir />}
                    </div>
                    {prazo.aConferir && <BotaoConfirmarPrazo prazoId={prazo.id} />}
                  </div>
                  <p className="mt-1 text-xs text-texto-secundario">
                    {prazo.dias} dias ({prazo.contagem ? LABEL_CONTAGEM[prazo.contagem] : "—"}) contados
                    a partir da publicação em {prazo.dataBase ? formatarData(prazo.dataBase) : "—"}.
                    Para corrigir, abra o prazo e clique em Editar.
                  </p>
                </li>
              ))}
            </ul>
          ) : publicacao.prazoADefinir ? (
            <div className="rounded-lg border border-atencao/40 bg-atencao-fundo p-4 text-sm">
              <p className="font-semibold text-atencao">Prazo não identificado no texto.</p>
              <p className="mt-1 text-atencao">
                Informe o prazo para cadastrá-lo, ou marque que esta publicação não abre prazo.
                Publicação considerada feita em{" "}
                {formatarData(dataPublicacaoEfetiva(publicacao.dataPublicacao))} (1º dia útil
                após a disponibilização); a contagem começa no dia útil seguinte.
              </p>
              <form
                action={definirPrazoDaPublicacao.bind(null, publicacao.id)}
                className="mt-4 grid grid-cols-3 gap-3 items-end"
              >
                <div>
                  <label className={classeLabel} htmlFor="dias">Dias</label>
                  <input id="dias" name="dias" type="number" min={1} max={365} required className={classeInput} />
                </div>
                <div>
                  <label className={classeLabel} htmlFor="contagem">Contagem</label>
                  <select id="contagem" name="contagem" defaultValue="DIAS_UTEIS" className={classeInput}>
                    <option value="DIAS_UTEIS">Dias úteis</option>
                    <option value="DIAS_CORRIDOS">Dias corridos</option>
                  </select>
                </div>
                <div>
                  <label className={classeLabel} htmlFor="tipo">Tipo</label>
                  <select id="tipo" name="tipo" defaultValue="MANIFESTACAO" className={classeInput}>
                    <option value="MANIFESTACAO">{LABEL_TIPO_PRAZO.MANIFESTACAO}</option>
                    <option value="PETICAO">{LABEL_TIPO_PRAZO.PETICAO}</option>
                    <option value="RECURSO">{LABEL_TIPO_PRAZO.RECURSO}</option>
                    <option value="OUTRO">{LABEL_TIPO_PRAZO.OUTRO}</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className={classeLabel} htmlFor="observacoes">Observações (opcional)</label>
                  <input id="observacoes" name="observacoes" placeholder="Ex.: contrarrazões à apelação" className={classeInput} />
                </div>
                <div className="col-span-3">
                  <BotaoEnvio className={classeBotaoPrimario} textoAguardando="Cadastrando…">
                    Cadastrar prazo
                  </BotaoEnvio>
                </div>
              </form>
              <form action={marcarPublicacaoSemPrazo.bind(null, publicacao.id)} className="mt-3">
                <BotaoEnvio className={classeBotaoSecundario} textoAguardando="Salvando…">
                  Esta publicação não abre prazo
                </BotaoEnvio>
              </form>
            </div>
          ) : (
            <p className="text-sm text-texto-secundario">Nenhum prazo vinculado a esta publicação.</p>
          )}
        </div>
      )}

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
