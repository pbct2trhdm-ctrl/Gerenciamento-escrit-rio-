"use client";

import { useEffect, useState } from "react";

/**
 * Mantém um painel montado durante a animação de fechar: com `aberto` falso,
 * `fechando` fica verdadeiro por `duracaoMs` antes de `montado` virar falso.
 */
export function useAbertura(aberto: boolean, duracaoMs = 200) {
  const [montado, setMontado] = useState(aberto);
  const [anterior, setAnterior] = useState(aberto);

  if (aberto !== anterior) {
    setAnterior(aberto);
    if (aberto) setMontado(true);
  }

  useEffect(() => {
    if (aberto || !montado) return;
    const espera = setTimeout(() => setMontado(false), duracaoMs);
    return () => clearTimeout(espera);
  }, [aberto, montado, duracaoMs]);

  return { montado, fechando: montado && !aberto };
}
