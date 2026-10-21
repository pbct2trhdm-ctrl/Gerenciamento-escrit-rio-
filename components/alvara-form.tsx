"use client";

import { useState } from "react";
import type { Alvara, Processo, Cliente } from "@/app/generated/prisma/client";
import {
  classeInput,
  classeLabel,
  classeBotaoPrimario,
  classeBotaoSecundario,
} from "@/lib/estilos";
import { calcularAlvara, calcularHonorariosContratuais } from "@/lib/alvara";
import { formatarMoeda } from "@/lib/formatacao";
import { BotaoEnvio } from "@/components/botao-envio";

type ProcessoComCliente = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: Pick<Cliente, "nome">;
};

export type OpcaoSucumbencia = { id: string; processoId: string; label: string };
export type OpcaoParcela = {
  id: string;
  processoId: string;
  label: string;
  percentualExito: number | null;
};

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

const paraNumero = (texto: string) => {
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
};

const textoInicial = (valor: number | null | undefined) =>
  valor !== null && valor !== undefined && valor !== 0 ? String(valor) : "";

export function AlvaraForm({
  alvara,
  processos,
  sucumbencias,
  parcelas,
  parcelaQuitadaIdAtual,
  processoIdPadrao,
  action,
}: {
  alvara?: Alvara;
  processos?: ProcessoComCliente[];
  sucumbencias: OpcaoSucumbencia[];
  parcelas: OpcaoParcela[];
  parcelaQuitadaIdAtual?: string | null;
  processoIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [processoId, setProcessoId] = useState(alvara?.processoId ?? processoIdPadrao ?? "");
  const [valorTotal, setValorTotal] = useState(textoInicial(alvara?.valorTotal));
  const [impostoRetido, setImpostoRetido] = useState(textoInicial(alvara?.impostoRetido));
  const [tarifas, setTarifas] = useState(textoInicial(alvara?.tarifas));
  const [contratuais, setContratuais] = useState(textoInicial(alvara?.honorariosContratuais));
  const [sucumbencia, setSucumbencia] = useState(textoInicial(alvara?.honorariosSucumbencia));
  const [reembolso, setReembolso] = useState(textoInicial(alvara?.reembolsoDespesas));
  const [parcelaQuitadaId, setParcelaQuitadaId] = useState(parcelaQuitadaIdAtual ?? "");
  const [percentual, setPercentual] = useState(textoInicial(alvara?.percentualContratual));

  const calculo = calcularAlvara({
    valorTotal: paraNumero(valorTotal),
    impostoRetido: paraNumero(impostoRetido),
    tarifas: paraNumero(tarifas),
    honorariosContratuais: paraNumero(contratuais),
    honorariosSucumbencia: paraNumero(sucumbencia),
    reembolsoDespesas: paraNumero(reembolso),
  });

  const sucumbenciasDoProcesso = sucumbencias.filter((s) => s.processoId === processoId);
  const parcelasDoProcesso = parcelas.filter((p) => p.processoId === processoId);

  function escolherParcela(id: string) {
    setParcelaQuitadaId(id);
    const parcela = parcelas.find((p) => p.id === id);
    if (parcela?.percentualExito && !percentual) setPercentual(String(parcela.percentualExito));
  }

  function aplicarPercentual() {
    const pct = paraNumero(percentual);
    if (pct > 0) setContratuais(calcularHonorariosContratuais(calculo.baseContratual, pct).toFixed(2));
  }

  const campoValor = (
    id: string,
    rotulo: string,
    valor: string,
    alterar: (v: string) => void,
    ajuda?: string
  ) => (
    <div>
      <label className={classeLabel} htmlFor={id}>
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={0}
        value={valor}
        onChange={(e) => alterar(e.target.value)}
        className={classeInput}
      />
      {ajuda && <p className="mt-1 text-xs text-texto-secundario">{ajuda}</p>}
    </div>
  );

  return (
    <form action={action} className="max-w-xl space-y-4">
      {processos && (
        <div>
          <label className={classeLabel} htmlFor="processoId">
            Processo
          </label>
          <select
            id="processoId"
            name="processoId"
            required
            value={processoId}
            onChange={(e) => {
              setProcessoId(e.target.value);
              setParcelaQuitadaId("");
            }}
            className={classeInput}
          >
            <option value="" disabled>
              Selecione um processo
            </option>
            {processos.map((processo) => (
              <option key={processo.id} value={processo.id}>
                {processo.cliente.nome} ·{" "}
                {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <fieldset className="rounded-md border border-slate-200 p-3 space-y-3">
        <legend className="font-display text-sm font-medium px-1 text-texto-principal">
          Valor recebido
        </legend>
        {campoValor("valorTotal", "Valor bruto do alvará (R$)", valorTotal, setValorTotal)}
        <div className="grid grid-cols-2 gap-3">
          {campoValor("impostoRetido", "IR retido na fonte (R$)", impostoRetido, setImpostoRetido)}
          {campoValor("tarifas", "Tarifas bancárias (R$)", tarifas, setTarifas)}
        </div>
        <p className="text-sm">
          Valor líquido recebido: <strong>{formatarMoeda(calculo.valorLiquido)}</strong>
        </p>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-3 space-y-3">
        <legend className="font-display text-sm font-medium px-1 text-texto-principal">
          Retido pelo escritório
        </legend>
        <div>
          <label className={classeLabel} htmlFor="honorariosContratuais">
            Honorários contratuais (R$)
          </label>
          <div className="flex gap-2">
            <input
              id="honorariosContratuais"
              name="honorariosContratuais"
              type="number"
              step="0.01"
              min={0}
              value={contratuais}
              onChange={(e) => setContratuais(e.target.value)}
              className={classeInput}
            />
            <input
              name="percentualContratual"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              placeholder="%"
              aria-label="Percentual dos honorários contratuais"
              className={`${classeInput} !w-24`}
            />
            <button type="button" onClick={aplicarPercentual} className={classeBotaoSecundario}>
              Calcular
            </button>
          </div>
          <p className="mt-1 text-xs text-texto-secundario">
            Informe o % e clique em Calcular: aplica sobre o crédito do cliente (líquido −
            sucumbência = {formatarMoeda(calculo.baseContratual)}). Pode ajustar o valor à mão.
          </p>
        </div>
        {parcelasDoProcesso.length > 0 && (
          <div>
            <label className={classeLabel} htmlFor="parcelaQuitadaId">
              Parcela de honorários quitada por este alvará (opcional)
            </label>
            <select
              id="parcelaQuitadaId"
              name="parcelaQuitadaId"
              value={parcelaQuitadaId}
              onChange={(e) => escolherParcela(e.target.value)}
              className={classeInput}
            >
              <option value="">Nenhuma</option>
              {parcelasDoProcesso.map((parcela) => (
                <option key={parcela.id} value={parcela.id}>
                  {parcela.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-texto-secundario">
              A parcela fica como paga, mas o valor entra no caixa só pelo alvará — sem contar duas vezes.
            </p>
          </div>
        )}
        {campoValor(
          "honorariosSucumbencia",
          "Honorários de sucumbência (R$)",
          sucumbencia,
          setSucumbencia,
          "Pertencem ao advogado (Lei 8.906/1994, art. 23) e não entram na base do % contratual."
        )}
        {sucumbenciasDoProcesso.length > 0 && (
          <div>
            <label className={classeLabel} htmlFor="honorarioSucumbencialId">
              Sucumbência vinculada (opcional)
            </label>
            <select
              id="honorarioSucumbencialId"
              name="honorarioSucumbencialId"
              defaultValue={alvara?.honorarioSucumbencialId ?? ""}
              className={classeInput}
            >
              <option value="">Nenhuma</option>
              {sucumbenciasDoProcesso.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-texto-secundario">
              Com data de recebimento, a sucumbência é marcada como recebida por este alvará.
            </p>
          </div>
        )}
        {campoValor(
          "reembolsoDespesas",
          "Reembolso de despesas adiantadas (R$)",
          reembolso,
          setReembolso,
          "Custas, perícia etc. pagas pelo escritório e descontadas da parte do cliente."
        )}
        <p className="text-sm">
          Total retido: <strong>{formatarMoeda(calculo.valorRetido)}</strong>
        </p>
      </fieldset>

      <div
        className={`rounded-md border p-3 text-sm ${
          calculo.valorRepassado < 0
            ? "border-critico/30 bg-critico-fundo text-critico"
            : "border-tranquilo/30 bg-tranquilo-fundo text-tranquilo"
        }`}
      >
        Valor a repassar ao cliente: <strong>{formatarMoeda(calculo.valorRepassado)}</strong>
        {calculo.valorRepassado < 0 && " — os valores retidos ultrapassam o valor líquido."}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={classeLabel}
            htmlFor="dataRecebimento"
          >
            Data de recebimento
          </label>
          <input
            id="dataRecebimento"
            name="dataRecebimento"
            type="date"
            defaultValue={paraInputDate(alvara?.dataRecebimento)}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={alvara?.status ?? "AGUARDANDO_REPASSE"}
            className={classeInput}
          >
            <option value="AGUARDANDO_REPASSE">Aguardando repasse</option>
            <option value="REPASSADO">Repassado</option>
          </select>
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="dataRepasse">
          Data do repasse
        </label>
        <input
          id="dataRepasse"
          name="dataRepasse"
          type="date"
          defaultValue={paraInputDate(alvara?.dataRepasse)}
          className={classeInput}
        />
      </div>

      <fieldset className="rounded-md border border-slate-200 p-3 space-y-3">
        <legend className="font-display text-sm font-medium px-1 text-texto-principal">Dados bancários de destino</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              className="block text-xs font-medium mb-1 text-texto-secundario"
              htmlFor="bancoDestino"
            >
              Banco
            </label>
            <input
              id="bancoDestino"
              name="bancoDestino"
              defaultValue={alvara?.bancoDestino ?? ""}
              className={classeInput}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1 text-texto-secundario"
              htmlFor="agenciaDestino"
            >
              Agência
            </label>
            <input
              id="agenciaDestino"
              name="agenciaDestino"
              defaultValue={alvara?.agenciaDestino ?? ""}
              className={classeInput}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1 text-texto-secundario"
              htmlFor="contaDestino"
            >
              Conta
            </label>
            <input
              id="contaDestino"
              name="contaDestino"
              defaultValue={alvara?.contaDestino ?? ""}
              className={classeInput}
            />
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1 text-texto-secundario"
            htmlFor="chavePixDestino"
          >
            Chave Pix (opcional)
          </label>
          <input
            id="chavePixDestino"
            name="chavePixDestino"
            defaultValue={alvara?.chavePixDestino ?? ""}
            className={classeInput}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-3 space-y-3">
        <legend className="font-display text-sm font-medium px-1 text-texto-principal">
          Documentos (anexados ao final da prestação de contas)
        </legend>
        {(
          [
            ["arquivoAlvara", "PDF do alvará judicial", alvara?.arquivoAlvaraNome],
            ["comprovanteRepasse", "Comprovante do repasse ao cliente", alvara?.comprovanteRepasseNome],
          ] as const
        ).map(([campo, rotulo, atual]) => (
          <div key={campo}>
            <label className={classeLabel} htmlFor={campo}>
              {rotulo}
            </label>
            <input
              id={campo}
              name={campo}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className={`${classeInput} file:mr-3 file:rounded-md file:border-0 file:bg-fundo file:px-3 file:py-1.5 file:text-sm file:font-medium`}
            />
            <p className="mt-1 text-xs text-texto-secundario">
              {atual ? `Atual: ${atual} — envie outro para substituir.` : "PDF, JPG ou PNG."}
            </p>
          </div>
        ))}
      </fieldset>

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={alvara?.observacoes ?? ""}
          rows={3}
          className={classeInput}
        />
      </div>

      <BotaoEnvio
        className={classeBotaoPrimario}
        textoAguardando="Salvando…"
        desabilitado={calculo.valorRepassado < 0}
      >
        Salvar
      </BotaoEnvio>
    </form>
  );
}
