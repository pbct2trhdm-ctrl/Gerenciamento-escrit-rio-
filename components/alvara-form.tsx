"use client";

import { useState } from "react";
import type {
  Alvara,
  Processo,
  Cliente,
  HonorarioSucumbencial,
} from "@/app/generated/prisma/client";

type ProcessoComCliente = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: Pick<Cliente, "nome">;
};

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export function AlvaraForm({
  alvara,
  processos,
  sucumbencias,
  processoIdPadrao,
  action,
}: {
  alvara?: Alvara;
  processos?: ProcessoComCliente[];
  sucumbencias: Pick<HonorarioSucumbencial, "id" | "processoId">[];
  processoIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [valorTotal, setValorTotal] = useState(alvara?.valorTotal?.toString() ?? "");
  const [valorRetido, setValorRetido] = useState(alvara?.valorRetido?.toString() ?? "");
  const [valorRepassado, setValorRepassado] = useState(
    alvara?.valorRepassado?.toString() ?? ""
  );
  const [repasseCustomizado, setRepasseCustomizado] = useState(Boolean(alvara));

  function recalcularRepasse(total: string, retido: string) {
    if (repasseCustomizado) return;
    const totalNumero = Number(total || 0);
    const retidoNumero = Number(retido || 0);
    setValorRepassado((totalNumero - retidoNumero).toFixed(2));
  }

  return (
    <form action={action} className="max-w-xl space-y-4">
      {processos && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="processoId">
            Processo
          </label>
          <select
            id="processoId"
            name="processoId"
            required
            defaultValue={processoIdPadrao ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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

      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="honorarioSucumbencialId"
        >
          Sucumbência vinculada (opcional)
        </label>
        <select
          id="honorarioSucumbencialId"
          name="honorarioSucumbencialId"
          defaultValue={alvara?.honorarioSucumbencialId ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma</option>
          {sucumbencias.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="valorTotal">
            Valor total (R$)
          </label>
          <input
            id="valorTotal"
            name="valorTotal"
            type="number"
            step="0.01"
            min={0}
            required
            value={valorTotal}
            onChange={(e) => {
              setValorTotal(e.target.value);
              recalcularRepasse(e.target.value, valorRetido);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="valorRetido">
            Valor retido — honorários (R$)
          </label>
          <input
            id="valorRetido"
            name="valorRetido"
            type="number"
            step="0.01"
            min={0}
            required
            value={valorRetido}
            onChange={(e) => {
              setValorRetido(e.target.value);
              recalcularRepasse(valorTotal, e.target.value);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="valorRepassado"
        >
          Valor repassado ao cliente (R$)
        </label>
        <input
          id="valorRepassado"
          name="valorRepassado"
          type="number"
          step="0.01"
          min={0}
          value={valorRepassado}
          onChange={(e) => {
            setRepasseCustomizado(true);
            setValorRepassado(e.target.value);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Calculado automaticamente como total − retido; pode ser ajustado
          manualmente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="dataRecebimento"
          >
            Data de recebimento
          </label>
          <input
            id="dataRecebimento"
            name="dataRecebimento"
            type="date"
            defaultValue={paraInputDate(alvara?.dataRecebimento)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={alvara?.status ?? "AGUARDANDO_REPASSE"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="AGUARDANDO_REPASSE">Aguardando repasse</option>
            <option value="REPASSADO">Repassado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dataRepasse">
          Data do repasse
        </label>
        <input
          id="dataRepasse"
          name="dataRepasse"
          type="date"
          defaultValue={paraInputDate(alvara?.dataRepasse)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <fieldset className="rounded-md border border-gray-200 p-3 space-y-3">
        <legend className="text-sm font-medium px-1">Dados bancários de destino</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="bancoDestino"
            >
              Banco
            </label>
            <input
              id="bancoDestino"
              name="bancoDestino"
              defaultValue={alvara?.bancoDestino ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="agenciaDestino"
            >
              Agência
            </label>
            <input
              id="agenciaDestino"
              name="agenciaDestino"
              defaultValue={alvara?.agenciaDestino ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="contaDestino"
            >
              Conta
            </label>
            <input
              id="contaDestino"
              name="contaDestino"
              defaultValue={alvara?.contaDestino ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            htmlFor="chavePixDestino"
          >
            Chave Pix (opcional)
          </label>
          <input
            id="chavePixDestino"
            name="chavePixDestino"
            defaultValue={alvara?.chavePixDestino ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={alvara?.observacoes ?? ""}
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
