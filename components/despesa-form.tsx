import type { Despesa, Processo, Cliente } from "@/app/generated/prisma/client";

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
        <label className="block text-sm font-medium mb-1" htmlFor="descricao">
          Descrição
        </label>
        <input
          id="descricao"
          name="descricao"
          required
          defaultValue={despesa?.descricao ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="categoria">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={despesa?.categoria ?? "OUTRO"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="CUSTAS">Custas</option>
            <option value="ALUGUEL">Aluguel</option>
            <option value="MATERIAL">Material</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="valor">
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="data">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={paraInputDate(despesa?.data)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="processoId">
            Processo vinculado (opcional)
          </label>
          <select
            id="processoId"
            name="processoId"
            defaultValue={despesa?.processoId ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Salvar
      </button>
    </form>
  );
}
