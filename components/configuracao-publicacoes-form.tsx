import type { ConfiguracaoPublicacoes } from "@/app/generated/prisma/client";
import { UFS_BRASIL } from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function ConfiguracaoPublicacoesForm({
  configuracao,
  action,
}: {
  configuracao: ConfiguracaoPublicacoes | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="numeroOab">
            Número da OAB
          </label>
          <input
            id="numeroOab"
            name="numeroOab"
            defaultValue={configuracao?.numeroOab ?? ""}
            placeholder="123456"
            className={classeInput}
          />
        </div>
        <div>
          <label className={classeLabel} htmlFor="seccionalOab">
            Seccional (UF)
          </label>
          <select
            id="seccionalOab"
            name="seccionalOab"
            defaultValue={configuracao?.seccionalOab ?? ""}
            className={classeInput}
          >
            <option value="" disabled>
              Selecione a UF
            </option>
            {UFS_BRASIL.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="horarioConsulta">
          Horário de consulta da rotina diária
        </label>
        <input
          id="horarioConsulta"
          name="horarioConsulta"
          type="time"
          required
          defaultValue={configuracao?.horarioConsulta ?? "07:00"}
          className={classeInput}
        />
        <p className="mt-1 text-xs text-texto-secundario">
          Horário local deste computador. O envio do resumo por WhatsApp reaproveita a
          configuração de Notificações abaixo.
        </p>
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Salvar configurações
      </button>
    </form>
  );
}
