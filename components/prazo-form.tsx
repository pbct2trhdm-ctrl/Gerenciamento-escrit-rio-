"use client";

import { useMemo, useState } from "react";
import type { Processo, Prazo } from "@/app/generated/prisma/client";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import { formatarData } from "@/lib/formatacao";

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
        <label className="block text-sm font-medium mb-1" htmlFor="processoId">
          Processo
        </label>
        <select
          id="processoId"
          name="processoId"
          required
          defaultValue={prazo?.processoId ?? processoIdPadrao ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
        <label className="block text-sm font-medium mb-1" htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={prazo?.tipo ?? "PETICAO"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium mb-1" htmlFor="dataBase">
            Data base
          </label>
          <input
            id="dataBase"
            name="dataBase"
            type="date"
            required
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="dias">
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="contagem">
          Tipo de contagem
        </label>
        <select
          id="contagem"
          name="contagem"
          value={contagem}
          onChange={(e) => setContagem(e.target.value as TipoContagem)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="DIAS_UTEIS">Dias úteis</option>
          <option value="DIAS_CORRIDOS">Dias corridos</option>
        </select>
      </div>

      <div className="rounded-md bg-gray-100 px-3 py-2 text-sm">
        <span className="text-gray-500">Data final calculada: </span>
        <span className="font-semibold">
          {dataFinal ? formatarData(dataFinal) : "—"}
        </span>
      </div>

      {prazo && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={prazo.status}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="CUMPRIDO">Cumprido</option>
            <option value="PERDIDO">Perdido</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={prazo?.observacoes ?? ""}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Salvar
      </button>
    </form>
  );
}
