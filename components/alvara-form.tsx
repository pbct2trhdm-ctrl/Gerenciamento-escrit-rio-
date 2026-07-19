"use client";

import { useState } from "react";
import type {
  Alvara,
  Processo,
  Cliente,
  HonorarioSucumbencial,
} from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

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
          <label className={classeLabel} htmlFor="processoId">
            Processo
          </label>
          <select
            id="processoId"
            name="processoId"
            required
            defaultValue={processoIdPadrao ?? ""}
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

      <div>
        <label
          className={classeLabel}
          htmlFor="honorarioSucumbencialId"
        >
          Sucumbência vinculada (opcional)
        </label>
        <select
          id="honorarioSucumbencialId"
          name="honorarioSucumbencialId"
          defaultValue={alvara?.honorarioSucumbencialId ?? ""}
          className={classeInput}
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
          <label className={classeLabel} htmlFor="valorTotal">
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
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="valorRetido">
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
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label
          className={classeLabel}
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
          className={classeInput}
        />
        <p className="text-xs text-texto-secundario mt-1">
          Calculado automaticamente como total − retido; pode ser ajustado
          manualmente.
        </p>
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

      <fieldset className="rounded-md border border-gray-200 p-3 space-y-3">
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

      <button
        type="submit"
        className={classeBotaoPrimario}
      >
        Salvar
      </button>
    </form>
  );
}
