"use client";

import { useState } from "react";
import { TIPOS_ANDAMENTO, LABEL_TIPO_ANDAMENTO } from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

const TIPOS_PRAZO_RAPIDO = ["PETICAO", "RECURSO", "MANIFESTACAO", "OUTRO"] as const;
const LABEL_TIPO_PRAZO_RAPIDO: Record<string, string> = {
  PETICAO: "Petição",
  RECURSO: "Recurso",
  MANIFESTACAO: "Manifestação",
  OUTRO: "Outro",
};

export function AndamentoForm({
  processoId,
  action,
}: {
  processoId: string;
  action: (formData: FormData) => void;
}) {
  const [data, setData] = useState("");
  const [geraPrazo, setGeraPrazo] = useState(false);
  const [prazoDataBase, setPrazoDataBase] = useState("");
  const [prazoDataBaseTocado, setPrazoDataBaseTocado] = useState(false);

  function alterarData(valor: string) {
    setData(valor);
    if (!prazoDataBaseTocado) {
      setPrazoDataBase(valor);
    }
  }

  function alterarPrazoDataBase(valor: string) {
    setPrazoDataBase(valor);
    setPrazoDataBaseTocado(true);
  }

  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="processoId" value={processoId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="data">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            value={data}
            onChange={(e) => alterarData(e.target.value)}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="tipo">
            Tipo
          </label>
          <select id="tipo" name="tipo" required defaultValue="" className={classeInput}>
            <option value="" disabled>
              Selecione o tipo
            </option>
            {TIPOS_ANDAMENTO.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_TIPO_ANDAMENTO[codigo]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          rows={3}
          className={classeInput}
        />
      </div>

      <div>
        <label className={classeLabel} htmlFor="arquivo">
          Anexo (opcional)
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className={`${classeInput} file:mr-3 file:rounded-md file:border-0 file:bg-fundo file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="geraPrazo"
          name="geraPrazo"
          type="checkbox"
          checked={geraPrazo}
          onChange={(e) => setGeraPrazo(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <label htmlFor="geraPrazo" className="text-sm font-medium text-texto-principal">
          Este andamento gera um prazo?
        </label>
      </div>

      {geraPrazo && (
        <div className="rounded-md border border-slate-200 bg-fundo p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={classeLabel} htmlFor="prazoDataBase">
                Data base do prazo
              </label>
              <input
                id="prazoDataBase"
                name="prazoDataBase"
                type="date"
                required={geraPrazo}
                value={prazoDataBase}
                onChange={(e) => alterarPrazoDataBase(e.target.value)}
                className={classeInput}
              />
            </div>
            <div>
              <label className={classeLabel} htmlFor="prazoTipo">
                Tipo de prazo
              </label>
              <select
                id="prazoTipo"
                name="prazoTipo"
                required={geraPrazo}
                defaultValue=""
                className={classeInput}
              >
                <option value="" disabled>
                  Selecione o tipo
                </option>
                {TIPOS_PRAZO_RAPIDO.map((codigo) => (
                  <option key={codigo} value={codigo}>
                    {LABEL_TIPO_PRAZO_RAPIDO[codigo]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={classeLabel} htmlFor="prazoDias">
                Dias
              </label>
              <input
                id="prazoDias"
                name="prazoDias"
                type="number"
                min={1}
                required={geraPrazo}
                className={classeInput}
              />
            </div>
            <div>
              <label className={classeLabel} htmlFor="prazoContagem">
                Tipo de contagem
              </label>
              <select
                id="prazoContagem"
                name="prazoContagem"
                defaultValue="DIAS_UTEIS"
                className={classeInput}
              >
                <option value="DIAS_UTEIS">Dias úteis</option>
                <option value="DIAS_CORRIDOS">Dias corridos</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <button type="submit" className={classeBotaoPrimario}>
        Registrar andamento
      </button>
    </form>
  );
}
