"use client";

import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";

export function AtualizacaoUploadForm({
  processoId,
  action,
}: {
  processoId: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="processoId" value={processoId} />

      <div>
        <label className={classeLabel} htmlFor="arquivo">
          PDF do processo
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".pdf,application/pdf"
          required
          className={`${classeInput} file:mr-3 file:rounded-md file:border-0 file:bg-fundo file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
        <p className="mt-1 text-xs text-texto-secundario">
          O PDF baixado do PJe, eproc, Meu INSS etc. Até 22 MB e 600 páginas. Se os
          autos forem maiores, baixe só as páginas mais recentes.
        </p>
      </div>

      <div>
        <label className={classeLabel} htmlFor="orientacoes">
          Orientações para a mensagem (opcional)
        </label>
        <textarea
          id="orientacoes"
          name="orientacoes"
          rows={3}
          placeholder='Ex.: "Foque na sentença das páginas finais" ou "Avise que vou ligar para explicar o acordo"'
          className={classeInput}
        />
      </div>

      <BotaoEnvio
        className={classeBotaoPrimario}
        textoAguardando="Lendo o PDF e redigindo a mensagem… (pode levar 1 a 2 minutos)"
      >
        Gerar mensagem para o cliente
      </BotaoEnvio>
    </form>
  );
}
