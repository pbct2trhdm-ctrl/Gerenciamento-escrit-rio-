import type { Parcela } from "@/app/generated/prisma/client";

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

export function ParcelaForm({
  parcela,
  proximoNumero,
  action,
}: {
  parcela?: Parcela;
  proximoNumero?: number;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="numero">
            Nº
          </label>
          <input
            id="numero"
            name="numero"
            type="number"
            min={1}
            required
            defaultValue={parcela?.numero ?? proximoNumero ?? 1}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="valor">
            Valor (R$)
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={parcela?.valor ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="vencimento">
            Vencimento
          </label>
          <input
            id="vencimento"
            name="vencimento"
            type="date"
            required
            defaultValue={paraInputDate(parcela?.vencimento)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {parcela && (
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={parcela.status === "ATRASADO" ? "PENDENTE" : parcela.status}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="dataPagamento"
            >
              Data pagamento
            </label>
            <input
              id="dataPagamento"
              name="dataPagamento"
              type="date"
              defaultValue={paraInputDate(parcela.dataPagamento)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor="dataEmissaoNf"
            >
              Emissão da NF
            </label>
            <input
              id="dataEmissaoNf"
              name="dataEmissaoNf"
              type="date"
              defaultValue={paraInputDate(parcela.dataEmissaoNf)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm col-span-3">
            <input
              type="checkbox"
              name="notaFiscalEmitida"
              defaultChecked={parcela.notaFiscalEmitida}
            />
            Nota fiscal emitida
          </label>
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {parcela ? "Salvar parcela" : "Adicionar parcela"}
      </button>
    </form>
  );
}
