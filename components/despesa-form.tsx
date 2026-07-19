import type { Despesa, Processo, Cliente } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

type ProcessoComCliente = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: Pick<Cliente, "nome">;
};

function paraInputDate(data: Date | string | null | undefined): string {
  const d = data ? (typeof data === "string" ? new Date(data) : data) : new Date();
  return d.toISOString().slice(0, 10);
}

export function DespesaForm({
  despesa,
  processos,
  action,
}: {
  despesa?: Despesa;
  processos: ProcessoComCliente[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input
          id="descricao"
          name="descricao"
          required
          defaultValue={despesa?.descricao ?? ""}
          className={classeInput}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="categoria">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={despesa?.categoria ?? "OUTRO"}
            className={classeInput}
          >
            <option value="CUSTAS">Custas</option>
            <option value="ALUGUEL">Aluguel</option>
            <option value="MATERIAL">Material</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor (R$)
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={despesa?.valor ?? ""}
            className={classeInput}
          />
        </div>
      </div>

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
            defaultValue={paraInputDate(despesa?.data)}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="processoId">
            Processo vinculado (opcional)
          </label>
          <select
            id="processoId"
            name="processoId"
            defaultValue={despesa?.processoId ?? ""}
            className={classeInput}
          >
            <option value="">Nenhum — despesa geral do escritório</option>
            {processos.map((processo) => (
              <option key={processo.id} value={processo.id}>
                {processo.cliente.nome} ·{" "}
                {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
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
