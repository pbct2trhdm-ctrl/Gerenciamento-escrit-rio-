"use client";

import { useState } from "react";
import type { Compromisso } from "@/app/generated/prisma/client";
import { BotaoEnvio } from "@/components/botao-envio";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

type Tipo = "REUNIAO" | "DILIGENCIA";

const SUGESTOES: Record<Tipo, string[]> = {
  REUNIAO: ["Reunião com cliente", "Atendimento inicial", "Reunião de alinhamento", "Reunião com a parte contrária"],
  DILIGENCIA: [
    "Protocolo no fórum",
    "Despacho com magistrado",
    "Cópia/vista de autos",
    "Atendimento na secretaria da vara",
    "Cartório",
    "INSS (agência)",
  ],
};

const horaDe = (data: Date | null | undefined) => (data ? new Date(data).toISOString().slice(11, 16) : "");

export function CompromissoForm({
  compromisso,
  tipoPadrao = "REUNIAO",
  dataPadrao,
  processoIdPadrao,
  clientes,
  processos,
  action,
}: {
  compromisso?: Compromisso;
  tipoPadrao?: Tipo;
  dataPadrao: string;
  processoIdPadrao?: string;
  clientes: { id: string; nome: string }[];
  processos: { id: string; numeroProcesso: string | null; clienteId: string; cliente: { nome: string } }[];
  action: (formData: FormData) => void;
}) {
  const [tipo, setTipo] = useState<Tipo>((compromisso?.tipo as Tipo) ?? tipoPadrao);
  const [horaInicio, setHoraInicio] = useState(horaDe(compromisso?.inicio));
  const processoInicial = compromisso?.processoId ?? processoIdPadrao ?? "";
  const [processoId, setProcessoId] = useState(processoInicial);
  const [clienteId, setClienteId] = useState(
    compromisso?.clienteId ?? processos.find((p) => p.id === processoInicial)?.clienteId ?? ""
  );
  const processosDoCliente = clienteId ? processos.filter((p) => p.clienteId === clienteId) : processos;

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <fieldset>
        <legend className={classeLabel}>Tipo</legend>
        <div className="inline-flex gap-1 rounded-md border border-slate-300 bg-superficie p-1">
          {(["REUNIAO", "DILIGENCIA"] as const).map((opcao) => (
            <label
              key={opcao}
              className={`cursor-pointer rounded px-4 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                tipo === opcao ? "bg-base-escura text-white" : "text-texto-secundario hover:bg-fundo"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={opcao}
                checked={tipo === opcao}
                onChange={() => setTipo(opcao)}
                className="sr-only"
              />
              {opcao === "REUNIAO" ? "Reunião" : "Diligência"}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="titulo" className={classeLabel}>
          Assunto
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          list="sugestoes-titulo"
          defaultValue={compromisso?.titulo}
          placeholder={tipo === "REUNIAO" ? "Ex.: Reunião com cliente" : "Ex.: Protocolo no fórum"}
          className={classeInput}
        />
        <datalist id="sugestoes-titulo">
          {SUGESTOES[tipo].map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="data" className={classeLabel}>
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={compromisso ? new Date(compromisso.inicio).toISOString().slice(0, 10) : dataPadrao}
            className={classeInput}
          />
        </div>
        <div>
          <label htmlFor="horaInicio" className={classeLabel}>
            Início
          </label>
          <input
            id="horaInicio"
            name="horaInicio"
            type="time"
            required
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className={classeInput}
          />
        </div>
        <div>
          <label htmlFor="horaFim" className={classeLabel}>
            Término <span className="font-normal text-texto-secundario">(opcional)</span>
          </label>
          <input
            id="horaFim"
            name="horaFim"
            type="time"
            min={horaInicio || undefined}
            defaultValue={horaDe(compromisso?.fim)}
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label htmlFor="local" className={classeLabel}>
          Local
        </label>
        <input
          id="local"
          name="local"
          defaultValue={compromisso?.local ?? ""}
          placeholder={
            tipo === "REUNIAO" ? "Ex.: Escritório, ou deixe em branco se for on-line" : "Ex.: Fórum Cível de Belém — 5ª Vara Cível"
          }
          className={classeInput}
        />
      </div>

      {tipo === "REUNIAO" && (
        <div>
          <label htmlFor="link" className={classeLabel}>
            Link da reunião on-line <span className="font-normal text-texto-secundario">(opcional)</span>
          </label>
          <input
            id="link"
            name="link"
            type="url"
            defaultValue={compromisso?.link ?? ""}
            placeholder="https://meet.google.com/…"
            className={classeInput}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clienteId" className={classeLabel}>
            Cliente <span className="font-normal text-texto-secundario">(opcional)</span>
          </label>
          <select
            id="clienteId"
            name="clienteId"
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              if (!processos.some((p) => p.id === processoId && p.clienteId === e.target.value)) setProcessoId("");
            }}
            className={classeInput}
          >
            <option value="">Nenhum</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="processoId" className={classeLabel}>
            Processo <span className="font-normal text-texto-secundario">(opcional)</span>
          </label>
          <select
            id="processoId"
            name="processoId"
            value={processoId}
            onChange={(e) => {
              setProcessoId(e.target.value);
              const escolhido = processos.find((p) => p.id === e.target.value);
              if (escolhido) setClienteId(escolhido.clienteId);
            }}
            className={classeInput}
          >
            <option value="">Nenhum</option>
            {processosDoCliente.map((p) => (
              <option key={p.id} value={p.id}>
                {clienteId ? "" : `${p.cliente.nome} · `}
                {p.numeroProcesso ?? "sem número"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="observacoes" className={classeLabel}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={compromisso?.observacoes ?? ""}
          placeholder={tipo === "DILIGENCIA" ? "Ex.: levar procuração e cópia do RG" : "Pauta, documentos a pedir…"}
          className={classeInput}
        />
      </div>

      {compromisso && (
        <div>
          <label htmlFor="status" className={classeLabel}>
            Situação
          </label>
          <select id="status" name="status" defaultValue={compromisso.status} className={classeInput}>
            <option value="AGENDADO">Agendado</option>
            <option value="REALIZADO">Realizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      )}

      <BotaoEnvio className={classeBotaoPrimario} textoAguardando="Salvando…">
        {compromisso ? "Salvar alterações" : tipo === "REUNIAO" ? "Agendar reunião" : "Agendar diligência"}
      </BotaoEnvio>
    </form>
  );
}
