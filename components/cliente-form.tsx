import type { Cliente } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function ClienteForm({
  cliente,
  action,
}: {
  cliente?: Cliente;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="nome">
          Nome / Razão social
        </label>
        <input
          id="nome"
          name="nome"
          defaultValue={cliente?.nome}
          required
          className={classeInput}
        />
      </div>

      <div>
        <label className={classeLabel} htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={cliente?.tipo ?? "PF"}
          className={classeInput}
        >
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
      </div>

      <div>
        <label className={classeLabel} htmlFor="cpfCnpj">
          CPF/CNPJ
        </label>
        <input
          id="cpfCnpj"
          name="cpfCnpj"
          defaultValue={cliente?.cpfCnpj ?? ""}
          className={classeInput}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="telefone">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            defaultValue={cliente?.telefone ?? ""}
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={cliente?.observacoes ?? ""}
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
