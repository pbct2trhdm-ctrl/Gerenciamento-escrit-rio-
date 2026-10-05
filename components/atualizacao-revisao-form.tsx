"use client";

import { useState } from "react";
import {
  classeInput,
  classeLabel,
  classeBotaoPrimario,
  classeBotaoSecundario,
} from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LABEL_TIPO_ANDAMENTO } from "@/lib/formatacao";

export function AtualizacaoRevisaoForm({
  atualizacao,
  tiposAndamento,
  andamentoRegistrado,
  telefoneWhatsapp,
  emailCliente,
  action,
}: {
  atualizacao: {
    id: string;
    resumoInterno: string;
    tipoAndamento: string;
    /** AAAA-MM-DD ou "" quando a IA não identificou a data. */
    dataMovimentacao: string;
    mensagemWhatsapp: string;
    assuntoEmail: string;
    corpoEmail: string;
  };
  tiposAndamento: readonly string[];
  andamentoRegistrado: boolean;
  /** Telefone do cliente já normalizado (só dígitos, com 55) ou null. */
  telefoneWhatsapp: string | null;
  emailCliente: string | null;
  action: (formData: FormData) => void;
}) {
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState(atualizacao.mensagemWhatsapp);
  const [assuntoEmail, setAssuntoEmail] = useState(atualizacao.assuntoEmail);
  const [corpoEmail, setCorpoEmail] = useState(atualizacao.corpoEmail);
  const [copiado, setCopiado] = useState(false);

  async function copiarWhatsapp() {
    try {
      await navigator.clipboard.writeText(mensagemWhatsapp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navegador sem permissão de área de transferência — o texto continua selecionável
    }
  }

  const linkWhatsappWeb = telefoneWhatsapp
    ? `https://wa.me/${telefoneWhatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`
    : null;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="id" value={atualizacao.id} />

      <section>
        <p className={`${classeLabel} mb-1`}>Andamento do processo</p>
        <p className="text-xs text-texto-secundario mb-3">
          O que a IA identificou no PDF, para você conferir. Não vai ao cliente: é
          registrado nos andamentos do processo{" "}
          {andamentoRegistrado
            ? "(já registrado — alterações aqui atualizam o andamento)."
            : "no primeiro envio, ou pelo botão abaixo."}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs text-texto-secundario mb-1" htmlFor="tipoAndamento">
              Tipo
            </label>
            <select
              id="tipoAndamento"
              name="tipoAndamento"
              defaultValue={atualizacao.tipoAndamento}
              className={classeInput}
            >
              {tiposAndamento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {LABEL_TIPO_ANDAMENTO[tipo] ?? tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-texto-secundario mb-1" htmlFor="dataMovimentacao">
              Data da movimentação
            </label>
            <input
              id="dataMovimentacao"
              name="dataMovimentacao"
              type="date"
              defaultValue={atualizacao.dataMovimentacao}
              className={classeInput}
            />
          </div>
        </div>
        <label className="block text-xs text-texto-secundario mb-1" htmlFor="resumoInterno">
          Resumo técnico
        </label>
        <textarea
          id="resumoInterno"
          name="resumoInterno"
          rows={3}
          defaultValue={atualizacao.resumoInterno}
          className={classeInput}
        />
        {!andamentoRegistrado && (
          <div className="mt-3">
            <BotaoEnvio
              name="acao"
              value="andamento"
              className={classeBotaoSecundario}
              textoAguardando="Registrando…"
            >
              Registrar andamento sem enviar
            </BotaoEnvio>
            <span className="ml-2 text-xs text-texto-secundario">
              Útil quando você envia pelo WhatsApp Web.
            </span>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-1">
          <label className={classeLabel} htmlFor="mensagemWhatsapp">
            Mensagem de WhatsApp
          </label>
          <span className="text-xs text-texto-secundario tabular-nums">
            {mensagemWhatsapp.length} caracteres
          </span>
        </div>
        <textarea
          id="mensagemWhatsapp"
          name="mensagemWhatsapp"
          rows={10}
          value={mensagemWhatsapp}
          onChange={(e) => setMensagemWhatsapp(e.target.value)}
          className={classeInput}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BotaoEnvio
            name="acao"
            value="whatsapp"
            className={classeBotaoPrimario}
            textoAguardando="Enviando WhatsApp…"
          >
            Enviar por WhatsApp
          </BotaoEnvio>
          <button type="button" onClick={copiarWhatsapp} className={classeBotaoSecundario}>
            {copiado ? "Copiado!" : "Copiar texto"}
          </button>
          {linkWhatsappWeb && (
            <a
              href={linkWhatsappWeb}
              target="_blank"
              rel="noopener noreferrer"
              className={classeBotaoSecundario}
            >
              Abrir no WhatsApp Web
            </a>
          )}
        </div>
        {!telefoneWhatsapp && (
          <p className="mt-2 text-xs text-atencao">
            O cliente não tem telefone válido no cadastro. Inclua o número com DDD
            para enviar.
          </p>
        )}
      </section>

      <section>
        <p className={`${classeLabel} mb-2`}>E-mail</p>
        <label className="block text-xs text-texto-secundario mb-1" htmlFor="assuntoEmail">
          Assunto
        </label>
        <input
          id="assuntoEmail"
          name="assuntoEmail"
          value={assuntoEmail}
          onChange={(e) => setAssuntoEmail(e.target.value)}
          className={`${classeInput} mb-3`}
        />
        <label className="block text-xs text-texto-secundario mb-1" htmlFor="corpoEmail">
          Texto
        </label>
        <textarea
          id="corpoEmail"
          name="corpoEmail"
          rows={14}
          value={corpoEmail}
          onChange={(e) => setCorpoEmail(e.target.value)}
          className={classeInput}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BotaoEnvio
            name="acao"
            value="email"
            className={classeBotaoPrimario}
            textoAguardando="Enviando e-mail…"
          >
            Enviar por e-mail
          </BotaoEnvio>
          {emailCliente ? (
            <span className="text-xs text-texto-secundario">Para: {emailCliente}</span>
          ) : (
            <span className="text-xs text-atencao">
              O cliente não tem e-mail no cadastro.
            </span>
          )}
        </div>
      </section>

      <div className="border-t border-borda-suave pt-4">
        <BotaoEnvio
          name="acao"
          value="salvar"
          className={classeBotaoSecundario}
          textoAguardando="Salvando…"
        >
          Salvar alterações sem enviar
        </BotaoEnvio>
      </div>
    </form>
  );
}
