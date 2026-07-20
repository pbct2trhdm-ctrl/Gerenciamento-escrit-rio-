"use client";

import { useState } from "react";
import type { Cliente, Processo } from "@/app/generated/prisma/client";
import { LABEL_AREA, AREAS_PROCESSO } from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { LABEL_TRIBUNAL, GRUPOS_TRIBUNAL } from "@/lib/tribunais";

export function ProcessoForm({
  processo,
  clientes,
  clienteIdPadrao,
  action,
}: {
  processo?: Processo;
  clientes: Pick<Cliente, "id" | "nome" | "cpfCnpj">[];
  clienteIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [area, setArea] = useState<string>(processo?.area ?? "CIVEL");

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
          defaultValue={processo?.clienteId ?? clienteIdPadrao ?? ""}
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

      <div>
        <label
          className={classeLabel}
          htmlFor="numeroProcesso"
        >
          Número do processo
        </label>
        <input
          id="numeroProcesso"
          name="numeroProcesso"
          defaultValue={processo?.numeroProcesso ?? ""}
          placeholder="Opcional — pode não ter número ainda"
          className={classeInput}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="area">
            Área
          </label>
          <select
            id="area"
            name="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={classeInput}
          >
            {AREAS_PROCESSO.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_AREA[codigo]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={classeLabel} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={processo?.status ?? "ATIVO"}
            className={classeInput}
          >
            <option value="ATIVO">Ativo</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="ARQUIVADO">Arquivado</option>
            <option value="ENCERRADO">Encerrado</option>
          </select>
        </div>
      </div>

      {area === "OUTRO" && (
        <div>
          <label className={classeLabel} htmlFor="areaOutraDescricao">
            Qual área?
          </label>
          <input
            id="areaOutraDescricao"
            name="areaOutraDescricao"
            required
            defaultValue={processo?.areaOutraDescricao ?? ""}
            placeholder="Ex.: Propriedade Intelectual"
            className={classeInput}
          />
        </div>
      )}

      <div>
        <label className={classeLabel} htmlFor="tribunal">
          Tribunal
        </label>
        <select
          id="tribunal"
          name="tribunal"
          defaultValue={processo?.tribunal ?? ""}
          className={classeInput}
        >
          <option value="">Não informado</option>
          {GRUPOS_TRIBUNAL.map((grupo) => (
            <optgroup key={grupo.label} label={grupo.label}>
              {grupo.opcoes.map((codigo) => (
                <option key={codigo} value={codigo}>
                  {LABEL_TRIBUNAL[codigo]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="vara">
            Vara
          </label>
          <input
            id="vara"
            name="vara"
            defaultValue={processo?.vara ?? ""}
            placeholder="Ex.: 1ª Vara Cível"
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="comarca">
            Comarca
          </label>
          <input
            id="comarca"
            name="comarca"
            defaultValue={processo?.comarca ?? ""}
            placeholder="Ex.: Belém"
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="resumo">
          Resumo
        </label>
        <textarea
          id="resumo"
          name="resumo"
          defaultValue={processo?.resumo ?? ""}
          rows={4}
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
