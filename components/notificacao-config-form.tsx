"use client";

import { useState } from "react";
import type { ConfiguracaoNotificacao } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

export function NotificacaoConfigForm({
  configuracao,
  action,
}: {
  configuracao: ConfiguracaoNotificacao | null;
  action: (formData: FormData) => void;
}) {
  const [provedor, setProvedor] = useState<string>(configuracao?.provedor ?? "");

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="numeroWhatsapp">
          Número de WhatsApp de destino
        </label>
        <input
          id="numeroWhatsapp"
          name="numeroWhatsapp"
          defaultValue={configuracao?.numeroWhatsapp ?? ""}
          placeholder="5591999999999 (código do país + DDD, só números)"
          className={classeInput}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="antecedenciaPadraoDias">
            Antecedência padrão (dias)
          </label>
          <input
            id="antecedenciaPadraoDias"
            name="antecedenciaPadraoDias"
            type="number"
            min={0}
            required
            defaultValue={configuracao?.antecedenciaPadraoDias ?? 3}
            className={classeInput}
          />
          <p className="mt-1 text-xs text-texto-secundario">
            Usada em prazos que não sobrescrevem a antecedência individualmente.
          </p>
        </div>
        <div>
          <label className={classeLabel} htmlFor="horarioDisparo">
            Horário de disparo da rotina diária
          </label>
          <input
            id="horarioDisparo"
            name="horarioDisparo"
            type="time"
            required
            defaultValue={configuracao?.horarioDisparo ?? "08:00"}
            className={classeInput}
          />
          <p className="mt-1 text-xs text-texto-secundario">
            Horário local deste computador.
          </p>
        </div>
      </div>

      <div>
        <label className={classeLabel} htmlFor="provedor">
          Provedor de WhatsApp
        </label>
        <select
          id="provedor"
          name="provedor"
          required
          value={provedor}
          onChange={(e) => setProvedor(e.target.value)}
          className={classeInput}
        >
          <option value="" disabled>
            Selecione o provedor
          </option>
          <option value="EVOLUTION_API">Evolution API (self-hosted, QR code)</option>
          <option value="Z_API">Z-API (serviço pago)</option>
        </select>
      </div>

      {provedor === "EVOLUTION_API" && (
        <div>
          <label className={classeLabel} htmlFor="urlBaseApi">
            URL do servidor Evolution API
          </label>
          <input
            id="urlBaseApi"
            name="urlBaseApi"
            defaultValue={configuracao?.urlBaseApi ?? ""}
            placeholder="https://minha-evolution.exemplo.com"
            className={classeInput}
          />
        </div>
      )}

      <div>
        <label className={classeLabel} htmlFor="instanciaId">
          {provedor === "Z_API" ? "ID da instância (Z-API)" : "Nome da instância (Evolution API)"}
        </label>
        <input
          id="instanciaId"
          name="instanciaId"
          defaultValue={configuracao?.instanciaId ?? ""}
          className={classeInput}
        />
      </div>

      <div>
        <label className={classeLabel} htmlFor="credencialApi">
          {provedor === "Z_API" ? "Token da instância (Z-API)" : "apikey (Evolution API)"}
        </label>
        <input
          id="credencialApi"
          name="credencialApi"
          type="password"
          defaultValue={configuracao?.credencialApi ?? ""}
          className={classeInput}
        />
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Salvar configurações
      </button>
    </form>
  );
}
