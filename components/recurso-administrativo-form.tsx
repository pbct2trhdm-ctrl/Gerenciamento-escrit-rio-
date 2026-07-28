import { ORGAOS_RECURSAL, LABEL_ORGAO_RECURSAL } from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function RecursoAdministrativoForm({
  processoAdministrativoId,
  action,
}: {
  processoAdministrativoId: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <input
        type="hidden"
        name="processoAdministrativoId"
        value={processoAdministrativoId}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="orgaoRecursal">
            Órgão recursal
          </label>
          <select id="orgaoRecursal" name="orgaoRecursal" required defaultValue="" className={classeInput}>
            <option value="" disabled>
              Selecione o órgão
            </option>
            {ORGAOS_RECURSAL.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_ORGAO_RECURSAL[codigo]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={classeLabel} htmlFor="dataInterposicao">
            Data de interposição
          </label>
          <input
            id="dataInterposicao"
            name="dataInterposicao"
            type="date"
            required
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea id="observacoes" name="observacoes" rows={3} className={classeInput} />
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Registrar recurso
      </button>
    </form>
  );
}
