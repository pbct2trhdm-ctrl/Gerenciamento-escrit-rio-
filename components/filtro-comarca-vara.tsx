"use client";

import { useState } from "react";
import { classeInputAuto } from "@/lib/estilos";

export function FiltroComarcaVara({
  pares,
  comarcaSelecionada,
  varaSelecionada,
}: {
  pares: { comarca: string | null; vara: string | null }[];
  comarcaSelecionada: string;
  varaSelecionada: string;
}) {
  const [comarca, setComarca] = useState(comarcaSelecionada);

  const comarcasDisponiveis = Array.from(
    new Set(pares.map((p) => p.comarca).filter((c): c is string => !!c))
  ).sort((a, b) => a.localeCompare(b));

  const varasDisponiveis = Array.from(
    new Set(
      pares
        .filter((p) => !comarca || p.comarca === comarca)
        .map((p) => p.vara)
        .filter((v): v is string => !!v)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <select
        name="comarca"
        value={comarca}
        onChange={(e) => setComarca(e.target.value)}
        className={classeInputAuto}
      >
        <option value="">Todas as comarcas</option>
        {comarcasDisponiveis.map((codigo) => (
          <option key={codigo} value={codigo}>
            {codigo}
          </option>
        ))}
      </select>
      {varasDisponiveis.length > 0 && (
        <select
          key={comarca}
          name="vara"
          defaultValue={varaSelecionada}
          className={classeInputAuto}
        >
          <option value="">Todas as varas</option>
          {varasDisponiveis.map((codigo) => (
            <option key={codigo} value={codigo}>
              {codigo}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
