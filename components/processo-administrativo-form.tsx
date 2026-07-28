"use client";

import { useState } from "react";
import type { Cliente, Processo, ProcessoAdministrativo } from "@/app/generated/prisma/client";
import {
  LABEL_ORGAO_PROCESSO_ADMINISTRATIVO,
  ORGAOS_PROCESSO_ADMINISTRATIVO,
  LABEL_TIPO_PROCESSO_ADMINISTRATIVO,
  TIPOS_POR_ORGAO_ADMINISTRATIVO,
  LABEL_STATUS_PROCESSO_ADMINISTRATIVO,
  STATUS_PROCESSO_ADMINISTRATIVO,
} from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

type ProcessoResumido = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: { nome: string };
};

export function ProcessoAdministrativoForm({
  processoAdministrativo,
  clientes,
  processosJudiciais,
  clienteIdPadrao,
  action,
}: {
  processoAdministrativo?: ProcessoAdministrativo;
  clientes: Pick<Cliente, "id" | "nome" | "cpfCnpj">[];
  processosJudiciais: ProcessoResumido[];
  clienteIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [orgao, setOrgao] = useState<string>(processoAdministrativo?.orgao ?? "INSS");
  const [tipo, setTipo] = useState<string>(processoAdministrativo?.tipo ?? "");

  const tiposDisponiveis = TIPOS_POR_ORGAO_ADMINISTRATIVO[orgao] ?? [];

  function alterarOrgao(valor: string) {
    setOrgao(valor);
    const opcoesValidas = TIPOS_POR_ORGAO_ADMINISTRATIVO[valor] ?? [];
    if (tipo && !opcoesValidas.includes(tipo)) {
      setTipo("");
    }
  }

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="clienteId">
          Cliente
        </label>
        <select
          id="clienteId"
          name="clienteId"
          required
          defaultValue={processoAdministrativo?.clienteId ?? clienteIdPadrao ?? ""}
          className={classeInput}
        >
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
              {cliente.cpfCnpj ? ` (${cliente.cpfCnpj})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="orgao">
            Órgão
          </label>
          <select
            id="orgao"
            name="orgao"
            value={orgao}
            onChange={(e) => alterarOrgao(e.target.value)}
            className={classeInput}
          >
            {ORGAOS_PROCESSO_ADMINISTRATIVO.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_ORGAO_PROCESSO_ADMINISTRATIVO[codigo]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={classeLabel} htmlFor="tipo">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={classeInput}
          >
            <option value="" disabled>
              Selecione o tipo
            </option>
            {tiposDisponiveis.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_TIPO_PROCESSO_ADMINISTRATIVO[codigo]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="numeroProtocolo">
            Número de protocolo
          </label>
          <input
            id="numeroProtocolo"
            name="numeroProtocolo"
            defaultValue={processoAdministrativo?.numeroProtocolo ?? ""}
            placeholder="Opcional"
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
            defaultValue={processoAdministrativo?.status ?? "EM_ANALISE"}
            className={classeInput}
          >
            {STATUS_PROCESSO_ADMINISTRATIVO.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_STATUS_PROCESSO_ADMINISTRATIVO[codigo]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="dataAbertura">
            Data de abertura
          </label>
          <input
            id="dataAbertura"
            name="dataAbertura"
            type="date"
            required
            defaultValue={paraInputDate(processoAdministrativo?.dataAbertura)}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="dataDecisao">
            Data da decisão
          </label>
          <input
            id="dataDecisao"
            name="dataDecisao"
            type="date"
            defaultValue={paraInputDate(processoAdministrativo?.dataDecisao)}
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="processoJudicialId">
          Processo judicial vinculado (opcional)
        </label>
        <select
          id="processoJudicialId"
          name="processoJudicialId"
          defaultValue={processoAdministrativo?.processoJudicialId ?? ""}
          className={classeInput}
        >
          <option value="">Nenhum</option>
          {processosJudiciais.map((processo) => (
            <option key={processo.id} value={processo.id}>
              {processo.cliente.nome} ·{" "}
              {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-texto-secundario">
          Preencha quando o caso administrativo evoluir para uma ação judicial.
        </p>
      </div>

      <div>
        <label className={classeLabel} htmlFor="resumo">
          Resumo
        </label>
        <textarea
          id="resumo"
          name="resumo"
          defaultValue={processoAdministrativo?.resumo ?? ""}
          rows={3}
          className={classeInput}
        />
      </div>

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={processoAdministrativo?.observacoes ?? ""}
          rows={3}
          className={classeInput}
        />
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Salvar
      </button>
    </form>
  );
}
