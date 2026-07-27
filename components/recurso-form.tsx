import { TIPOS_RECURSO, LABEL_TIPO_RECURSO } from "@/lib/formatacao";
import { LABEL_TRIBUNAL, GRUPOS_TRIBUNAL } from "@/lib/tribunais";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function RecursoForm({
  processoId,
  action,
}: {
  processoId: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="processoId" value={processoId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="tipoRecurso">
            Tipo de recurso
          </label>
          <select id="tipoRecurso" name="tipoRecurso" required defaultValue="" className={classeInput}>
            <option value="" disabled>
              Selecione o tipo
            </option>
            {TIPOS_RECURSO.map((codigo) => (
              <option key={codigo} value={codigo}>
                {LABEL_TIPO_RECURSO[codigo]}
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
        <label className={classeLabel} htmlFor="tribunal2Grau">
          Tribunal de 2º grau
        </label>
        <select id="tribunal2Grau" name="tribunal2Grau" defaultValue="" className={classeInput}>
          <option value="">Não informado</option>
          {GRUPOS_TRIBUNAL.map((grupo) => (
            <optgroup key={grupo.label} label={grupo.label}>
              {grupo.opcoes.map((codigo) => (
                <option key={codigo} value={codigo}>
                  {LABEL_TRIBUNAL[codigo]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="orgaoJulgador">
            Órgão julgador
          </label>
          <input
            id="orgaoJulgador"
            name="orgaoJulgador"
            placeholder="Ex.: 3ª Câmara Cível"
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="relator">
            Relator
          </label>
          <input id="relator" name="relator" className={classeInput} />
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
