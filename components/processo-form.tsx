import type { Cliente, Processo } from "@/app/generated/prisma/client";

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
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="clienteId">
          Cliente
        </label>
        <select
          id="clienteId"
          name="clienteId"
          required
          defaultValue={processo?.clienteId ?? clienteIdPadrao ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
          className="block text-sm font-medium mb-1"
          htmlFor="numeroProcesso"
        >
          Número do processo
        </label>
        <input
          id="numeroProcesso"
          name="numeroProcesso"
          defaultValue={processo?.numeroProcesso ?? ""}
          placeholder="Opcional — pode não ter número ainda"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="area">
            Área
          </label>
          <select
            id="area"
            name="area"
            defaultValue={processo?.area ?? "CIVEL"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="CIVEL">Cível</option>
            <option value="PREVIDENCIARIO">Previdenciário</option>
            <option value="TRIBUTARIO">Tributário</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={processo?.status ?? "ATIVO"}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ATIVO">Ativo</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="ARQUIVADO">Arquivado</option>
            <option value="ENCERRADO">Encerrado</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="varaTribunal"
        >
          Vara/Tribunal
        </label>
        <input
          id="varaTribunal"
          name="varaTribunal"
          defaultValue={processo?.varaTribunal ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="resumo">
          Resumo
        </label>
        <textarea
          id="resumo"
          name="resumo"
          defaultValue={processo?.resumo ?? ""}
          rows={4}
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
