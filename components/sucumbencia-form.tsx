import type {
  HonorarioSucumbencial,
  Processo,
  Cliente,
} from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={classeLabel}
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
            className={classeInput}
          />
        </div>
        <div>
          <label
            className={classeLabel}
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
            className={classeInput}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="percentual">
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
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={sucumbencia?.status ?? "AGUARDANDO_DECISAO"}
            className={classeInput}
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
            className={classeLabel}
            htmlFor="formaRecebimento"
          >
            Forma de recebimento
          </label>
          <select
            id="formaRecebimento"
            name="formaRecebimento"
            defaultValue={sucumbencia?.formaRecebimento ?? ""}
            className={classeInput}
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
            className={classeLabel}
            htmlFor="dataTransitoJulgado"
          >
            Trânsito em julgado
          </label>
          <input
            id="dataTransitoJulgado"
            name="dataTransitoJulgado"
            type="date"
            defaultValue={paraInputDate(sucumbencia?.dataTransitoJulgado)}
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label
          className={classeLabel}
          htmlFor="dataRecebimento"
        >
          Data de recebimento
        </label>
        <input
          id="dataRecebimento"
          name="dataRecebimento"
          type="date"
          defaultValue={paraInputDate(sucumbencia?.dataRecebimento)}
          className={classeInput}
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
            className={classeLabel}
            htmlFor="dataEmissaoNf"
          >
            Emissão da NF
          </label>
          <input
            id="dataEmissaoNf"
            name="dataEmissaoNf"
            type="date"
            defaultValue={paraInputDate(sucumbencia?.dataEmissaoNf)}
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
          defaultValue={sucumbencia?.observacoes ?? ""}
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
