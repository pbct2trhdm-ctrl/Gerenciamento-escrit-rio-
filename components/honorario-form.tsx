import type { Honorario, Processo, Cliente } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

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
        <label className={classeLabel} htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={honorario?.tipo ?? "FIXO"}
          className={classeInput}
        >
          <option value="FIXO">Fixo</option>
          <option value="PARCELADO">Parcelado</option>
          <option value="EXITO">Êxito</option>
          <option value="MENSALIDADE">Mensalidade</option>
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
            defaultValue={honorario?.valorTotal ?? ""}
            placeholder="Deixe em branco se for só êxito"
            className={classeInput}
          />
        </div>
        <div>
          <label
            className={classeLabel}
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
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="dataContrato">
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
          className={classeInput}
        />
      </div>

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={honorario?.observacoes ?? ""}
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
