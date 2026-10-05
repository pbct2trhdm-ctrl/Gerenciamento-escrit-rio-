import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  regenerarAtualizacaoCliente,
  salvarEEnviarAtualizacaoCliente,
  excluirAtualizacaoCliente,
} from "@/lib/actions/atualizacoes-cliente";
import { normalizarTelefoneWhatsapp } from "@/lib/whatsapp";
import { formatarDataHorario } from "@/lib/formatacao";
import { AtualizacaoRevisaoForm } from "@/components/atualizacao-revisao-form";
import { BotaoEnvio } from "@/components/botao-envio";
import { Badge } from "@/components/badge";
import { LinkVoltar } from "@/components/link-voltar";
import {
  classeBotaoPerigo,
  classeBotaoSecundario,
  classeCard,
  classeInput,
  classeLabel,
  classeTituloPagina,
} from "@/lib/estilos";

function StatusEnvio({
  canal,
  enviadoEm,
  erro,
}: {
  canal: string;
  enviadoEm: Date | null;
  erro: string | null;
}) {
  if (erro) {
    return (
      <div className="rounded-lg border border-critico/30 bg-critico-fundo px-4 py-3 text-sm text-critico">
        <span className="font-semibold">{canal} não enviado:</span> {erro}
      </div>
    );
  }
  if (enviadoEm) {
    return (
      <Badge tier="tranquilo">
        {canal} enviado em {formatarDataHorario(enviadoEm)}
      </Badge>
    );
  }
  return <Badge tier="neutro">{canal} ainda não enviado</Badge>;
}

export default async function RevisarAtualizacaoClientePage({
  params,
}: {
  params: Promise<{ id: string; atualizacaoId: string }>;
}) {
  const { id, atualizacaoId } = await params;

  const atualizacao = await prisma.atualizacaoCliente.findFirst({
    where: { id: atualizacaoId, processoId: id },
    include: { processo: { include: { cliente: true } } },
  });

  if (!atualizacao) {
    notFound();
  }

  const { processo } = atualizacao;
  const cliente = processo.cliente;

  return (
    <div className="max-w-3xl">
      <LinkVoltar href={`/processos/${processo.id}`} label="Voltar para o processo" />
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className={classeTituloPagina}>Atualização ao cliente</h1>
        <form action={excluirAtualizacaoCliente}>
          <input type="hidden" name="id" value={atualizacao.id} />
          <button type="submit" className={classeBotaoPerigo}>
            Excluir
          </button>
        </form>
      </div>
      <p className="text-texto-secundario mb-6">
        {cliente.nome} · {processo.numeroProcesso ?? "Processo sem número"} · criada em{" "}
        {formatarDataHorario(atualizacao.criadoEm)}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <StatusEnvio
          canal="WhatsApp"
          enviadoEm={atualizacao.whatsappEnviadoEm}
          erro={atualizacao.whatsappErro}
        />
        <StatusEnvio
          canal="E-mail"
          enviadoEm={atualizacao.emailEnviadoEm}
          erro={atualizacao.emailErro}
        />
      </div>

      {atualizacao.erroGeracao && (
        <div className="mb-6 rounded-lg border border-atencao/40 bg-atencao-fundo px-4 py-3 text-sm text-atencao">
          <p className="font-semibold">A IA não gerou a mensagem.</p>
          <p className="mt-1">{atualizacao.erroGeracao}</p>
          <p className="mt-1">Você pode tentar de novo abaixo ou escrever o texto manualmente.</p>
        </div>
      )}

      <div className={`${classeCard} mb-8 text-sm space-y-3`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p>
            <span className="text-texto-secundario">PDF analisado: </span>
            <a
              href={`/processos/${processo.id}/atualizacoes/${atualizacao.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline break-all"
            >
              {atualizacao.arquivoNome}
            </a>
          </p>
        </div>
        {atualizacao.resumoInterno && (
          <div>
            <p className="text-texto-secundario">O que a IA identificou (só para você conferir)</p>
            <p className="whitespace-pre-wrap">{atualizacao.resumoInterno}</p>
          </div>
        )}
        <details>
          <summary className="cursor-pointer text-texto-secundario hover:text-accent">
            Gerar a mensagem novamente
          </summary>
          <form action={regenerarAtualizacaoCliente} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={atualizacao.id} />
            <div>
              <label className={classeLabel} htmlFor="orientacoes">
                Orientações para a IA (opcional)
              </label>
              <textarea
                id="orientacoes"
                name="orientacoes"
                rows={2}
                defaultValue={atualizacao.orientacoes ?? ""}
                placeholder='Ex.: "Mais curto" ou "Explique melhor o que é a perícia"'
                className={classeInput}
              />
            </div>
            <p className="text-xs text-texto-secundario">
              O texto atual será substituído. Alterações não salvas abaixo serão perdidas.
            </p>
            <BotaoEnvio
              className={classeBotaoSecundario}
              textoAguardando="Redigindo novamente… (pode levar 1 a 2 minutos)"
            >
              Gerar novamente
            </BotaoEnvio>
          </form>
        </details>
      </div>

      <AtualizacaoRevisaoForm
        key={atualizacao.atualizadoEm.toISOString()}
        atualizacao={{
          id: atualizacao.id,
          mensagemWhatsapp: atualizacao.mensagemWhatsapp,
          assuntoEmail: atualizacao.assuntoEmail,
          corpoEmail: atualizacao.corpoEmail,
        }}
        telefoneWhatsapp={normalizarTelefoneWhatsapp(cliente.telefone)}
        emailCliente={cliente.email}
        action={salvarEEnviarAtualizacaoCliente}
      />
    </div>
  );
}
