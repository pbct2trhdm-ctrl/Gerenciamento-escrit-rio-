"use client";

import { useState } from "react";
import { classeInputAuto, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function RelatorioFiltro({
  tipoPeriodoInicial,
  mesInicial,
  dataInicioInicial,
  dataFimInicial,
  compararInicial,
}: {
  tipoPeriodoInicial: "mes" | "intervalo";
  mesInicial: string;
  dataInicioInicial: string;
  dataFimInicial: string;
  compararInicial: boolean;
}) {
  const [tipoPeriodo, setTipoPeriodo] = useState<"mes" | "intervalo">(tipoPeriodoInicial);

  return (
    <form method="get" className="flex flex-wrap items-end gap-4 mb-6">
      <div>
        <label className={classeLabel} htmlFor="tipoPeriodo">
          Período
        </label>
        <select
          id="tipoPeriodo"
          name="tipoPeriodo"
          value={tipoPeriodo}
          onChange={(e) => setTipoPeriodo(e.target.value as "mes" | "intervalo")}
          className={classeInputAuto}
        >
          <option value="mes">Mês específico</option>
          <option value="intervalo">Intervalo customizado</option>
        </select>
      </div>

      {tipoPeriodo === "mes" ? (
        <div>
          <label className={classeLabel} htmlFor="mes">
            Mês
          </label>
          <input
            id="mes"
            name="mes"
            type="month"
            defaultValue={mesInicial}
            className={classeInputAuto}
          />
        </div>
      ) : (
        <>
          <div>
            <label className={classeLabel} htmlFor="dataInicio">
              De
            </label>
            <input
              id="dataInicio"
              name="dataInicio"
              type="date"
              defaultValue={dataInicioInicial}
              className={classeInputAuto}
            />
          </div>
          <div>
            <label className={classeLabel} htmlFor="dataFim">
              Até
            </label>
            <input
              id="dataFim"
              name="dataFim"
              type="date"
              defaultValue={dataFimInicial}
              className={classeInputAuto}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 pb-2">
        <input
          id="comparar"
          name="comparar"
          type="checkbox"
          defaultChecked={compararInicial}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
        />
        <label htmlFor="comparar" className="text-sm font-medium text-texto-principal">
          Comparar com período anterior
        </label>
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Gerar prévia
      </button>
    </form>
  );
}
