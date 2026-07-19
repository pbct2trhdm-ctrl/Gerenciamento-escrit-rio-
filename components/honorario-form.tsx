import type { Honorario, Processo, Cliente } from "@/app/generated/prisma/client";

type ProcessoComCliente = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: Pick<Cliente, "nome">;
};

function paraInputDate(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export function HonorarioForm({
  honorario,
  processos,
  processoIdPadrao,
  action,
}: {
  honorario?: Honorario;
  processos?: ProcessoComCliente[];
  processoIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
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
        <label className="block text-sm font-medium mb-1" htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={honorario?.tipo ?? "FIXO"}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="FIXO">Fixo</option>
          <option value="PARCELADO">Parcelado</option>
          <option value="EXITO">Êxito</option>
          <option value="MENSALIDADE">Mensalidade</option>
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
            defaultValue={honorario?.valorTotal ?? ""}
            placeholder="Deixe em branco se for só êxito"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="percentualExito"
          >
            % de êxito
          </label>
          <input
            id="percentualExito"
            name="percentualExito"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={honorario?.percentualExito ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dataContrato">
          Data do contrato
        </label>
        <input
          id="dataContrato"
          name="dataContrato"
          type="date"
          required
          defaultValue={
            honorario ? paraInputDate(honorario.dataContrato) : paraInputDate(new Date())
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={honorario?.observacoes ?? ""}
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
