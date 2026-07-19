"use client";

import { useMemo, useState } from "react";
import type { Processo, Prazo } from "@/app/generated/prisma/client";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import { formatarData } from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

function paraInputDate(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export function PrazoForm({
  prazo,
  processos,
  processoIdPadrao,
  action,
}: {
  prazo?: Prazo;
  processos: Pick<Processo, "id" | "numeroProcesso">[];
  processoIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [dataBase, setDataBase] = useState(
    prazo ? paraInputDate(prazo.dataBase) : ""
  );
  const [dias, setDias] = useState(prazo?.dias?.toString() ?? "");
  const [contagem, setContagem] = useState<TipoContagem>(
    (prazo?.contagem as TipoContagem) ?? "DIAS_UTEIS"
  );

  const dataFinal = useMemo(() => {
    const diasNumero = Number(dias);
    if (!dataBase || !diasNumero || diasNumero <= 0) {
      return null;
    }
    const [ano, mes, dia] = dataBase.split("-").map(Number);
    const base = new Date(Date.UTC(ano, mes - 1, dia));
    return calcularDataFinal(base, diasNumero, contagem);
  }, [dataBase, dias, contagem]);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="processoId">
          Processo
        </label>
        <select
          id="processoId"
          name="processoId"
          required
          defaultValue={prazo?.processoId ?? processoIdPadrao ?? ""}
          className={classeInput}
        >
          <option value="" disabled>
            Selecione um processo
          </option>
          {processos.map((processo) => (
            <option key={processo.id} value={processo.id}>
              {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
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
          defaultValue={prazo?.tipo ?? "PETICAO"}
          className={classeInput}
        >
          <option value="PETICAO">Petição</option>
          <option value="RECURSO">Recurso</option>
          <option value="AUDIENCIA">Audiência</option>
          <option value="MANIFESTACAO">Manifestação</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="dataBase">
            Data base
          </label>
          <input
            id="dataBase"
            name="dataBase"
            type="date"
            required
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="dias">
            Dias
          </label>
          <input
            id="dias"
            name="dias"
            type="number"
            min={1}
            required
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="contagem">
          Tipo de contagem
        </label>
        <select
          id="contagem"
          name="contagem"
          value={contagem}
          onChange={(e) => setContagem(e.target.value as TipoContagem)}
          className={classeInput}
        >
          <option value="DIAS_UTEIS">Dias úteis</option>
          <option value="DIAS_CORRIDOS">Dias corridos</option>
        </select>
      </div>

      <div className="rounded-md bg-fundo border border-gray-200 px-3 py-2 text-sm">
        <span className="text-texto-secundario">Data final calculada: </span>
        <span className="font-semibold tabular-nums">
          {dataFinal ? formatarData(dataFinal) : "—"}
        </span>
      </div>

      {prazo && (
        <div>
          <label className={classeLabel} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={prazo.status}
            className={classeInput}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="CUMPRIDO">Cumprido</option>
            <option value="PERDIDO">Perdido</option>
          </select>
        </div>
      )}

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={prazo?.observacoes ?? ""}
          rows={3}
          className={classeInput}
        />
      </div>

      <button
        type="submit"
        className={classeBotaoPrimario}
      >
        Salvar
      </button>
    </form>
  );
}
