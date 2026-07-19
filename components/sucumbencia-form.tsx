import type {
  HonorarioSucumbencial,
  Processo,
  Cliente,
} from "@/app/generated/prisma/client";

type ProcessoComCliente = Pick<Processo, "id" | "numeroProcesso"> & {
  cliente: Pick<Cliente, "nome">;
};

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export function SucumbenciaForm({
  sucumbencia,
  processos,
  processoIdPadrao,
  action,
}: {
  sucumbencia?: HonorarioSucumbencial;
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="valorEstimado"
          >
            Valor estimado (R$)
          </label>
          <input
            id="valorEstimado"
            name="valorEstimado"
            type="number"
            step="0.01"
            min={0}
            defaultValue={sucumbencia?.valorEstimado ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="valorDefinido"
          >
            Valor definido (R$)
          </label>
          <input
            id="valorDefinido"
            name="valorDefinido"
            type="number"
            step="0.01"
            min={0}
            defaultValue={sucumbencia?.valorDefinido ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="percentual">
            Percentual (%)
          </label>
          <input
            id="percentual"
            name="percentual"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={sucumbencia?.percentual ?? ""}
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
            defaultValue={sucumbencia?.status ?? "AGUARDANDO_DECISAO"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="AGUARDANDO_DECISAO">Aguardando decisão</option>
            <option value="DEFINIDO">Definido</option>
            <option value="EM_EXECUCAO">Em execução</option>
            <option value="RECEBIDO">Recebido</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="formaRecebimento"
          >
            Forma de recebimento
          </label>
          <select
            id="formaRecebimento"
            name="formaRecebimento"
            defaultValue={sucumbencia?.formaRecebimento ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="RPV">RPV</option>
            <option value="PRECATORIO">Precatório</option>
            <option value="DEPOSITO_DIRETO">Depósito direto</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="dataTransitoJulgado"
          >
            Trânsito em julgado
          </label>
          <input
            id="dataTransitoJulgado"
            name="dataTransitoJulgado"
            type="date"
            defaultValue={paraInputDate(sucumbencia?.dataTransitoJulgado)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

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
          defaultValue={paraInputDate(sucumbencia?.dataRecebimento)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="notaFiscalEmitida"
            defaultChecked={sucumbencia?.notaFiscalEmitida}
          />
          Nota fiscal emitida
        </label>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="dataEmissaoNf"
          >
            Emissão da NF
          </label>
          <input
            id="dataEmissaoNf"
            name="dataEmissaoNf"
            type="date"
            defaultValue={paraInputDate(sucumbencia?.dataEmissaoNf)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={sucumbencia?.observacoes ?? ""}
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
