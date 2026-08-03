import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function RedesignacaoForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="dataNova">
            Nova data
          </label>
          <input
            id="dataNova"
            name="dataNova"
            type="date"
            required
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="horaNova">
            Novo horário
          </label>
          <input
            id="horaNova"
            name="horaNova"
            type="time"
            required
            className={classeInput}
          />
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="motivo">
          Motivo da redesignação
        </label>
        <textarea id="motivo" name="motivo" required rows={3} className={classeInput} />
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Redesignar audiência
      </button>
    </form>
  );
}
