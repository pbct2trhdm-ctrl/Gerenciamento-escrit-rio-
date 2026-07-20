import type { Cliente, Processo } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

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
            defaultValue={processo?.area ?? "CIVEL"}
            className={classeInput}
          >
            <option value="CIVEL">Cível</option>
            <option value="PREVIDENCIARIO">Previdenciário</option>
            <option value="TRIBUTARIO">Tributário</option>
            <option value="OUTRO">Outro</option>
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
