"use client";

import { useState } from "react";
import type { ObrigacaoSocietaria } from "@/app/generated/prisma/client";
import { sugerirInss, sugerirCpp } from "@/lib/financeiro";
import { classeInput, classeBotaoPrimario } from "@/lib/estilos";

function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

type Linha = {
  tipo: "PRO_LABORE" | "DAS" | "INSS_SOCIO" | "CPP_PATRONAL";
  label: string;
};

const LINHAS: Linha[] = [
  { tipo: "PRO_LABORE", label: "Pró-labore" },
  { tipo: "DAS", label: "DAS" },
  { tipo: "INSS_SOCIO", label: "INSS sócio (11%)" },
  { tipo: "CPP_PATRONAL", label: "CPP patronal (20%)" },
];

export function ObrigacoesForm({
  competenciaTexto,
  obrigacoes,
  action,
}: {
  competenciaTexto: string;
  obrigacoes: Record<string, ObrigacaoSocietaria | undefined>;
  action: (formData: FormData) => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>({
    PRO_LABORE: obrigacoes.PRO_LABORE?.valor.toString() ?? "",
    DAS: obrigacoes.DAS?.valor.toString() ?? "",
    INSS_SOCIO: obrigacoes.INSS_SOCIO?.valor.toString() ?? "",
    CPP_PATRONAL: obrigacoes.CPP_PATRONAL?.valor.toString() ?? "",
  });
  const [inssCustomizado, setInssCustomizado] = useState(Boolean(obrigacoes.INSS_SOCIO));
  const [cppCustomizado, setCppCustomizado] = useState(Boolean(obrigacoes.CPP_PATRONAL));

  function alterarProLabore(valor: string) {
    setValores((atual) => {
      const proximo: Record<string, string> = { ...atual, PRO_LABORE: valor };
      const numero = Number(valor || 0);
      if (!inssCustomizado) proximo.INSS_SOCIO = numero ? sugerirInss(numero).toString() : "";
      if (!cppCustomizado) proximo.CPP_PATRONAL = numero ? sugerirCpp(numero).toString() : "";
      return proximo;
    });
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="competencia" value={competenciaTexto} />
      <div className="rounded-lg border border-slate-200 bg-superficie divide-y divide-slate-100">
        {LINHAS.map((linha) => {
          const existente = obrigacoes[linha.tipo];
          return (
            <div key={linha.tipo} className="grid grid-cols-4 gap-3 p-3 items-end">
              <div className="font-display text-sm font-medium text-texto-principal">
                {linha.label}
              </div>
              <div>
                <label className="block text-xs text-texto-secundario mb-1">
                  Valor (R$)
                </label>
                <input
                  name={`valor_${linha.tipo}`}
                  type="number"
                  step="0.01"
                  min={0}
                  value={valores[linha.tipo]}
                  onChange={(e) => {
                    if (linha.tipo === "PRO_LABORE") {
                      alterarProLabore(e.target.value);
                    } else {
                      if (linha.tipo === "INSS_SOCIO") setInssCustomizado(true);
                      if (linha.tipo === "CPP_PATRONAL") setCppCustomizado(true);
                      setValores((atual) => ({ ...atual, [linha.tipo]: e.target.value }));
                    }
                  }}
                  className={`${classeInput} tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-xs text-texto-secundario mb-1">Status</label>
                <select
                  name={`status_${linha.tipo}`}
                  defaultValue={existente?.status ?? "PENDENTE"}
                  className={classeInput}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-texto-secundario mb-1">
                  Data pagamento
                </label>
                <input
                  name={`dataPagamento_${linha.tipo}`}
                  type="date"
                  defaultValue={paraInputDate(existente?.dataPagamento)}
                  className={classeInput}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button type="submit" className={classeBotaoPrimario}>
        Salvar obrigações do mês
      </button>
    </form>
  );
}
