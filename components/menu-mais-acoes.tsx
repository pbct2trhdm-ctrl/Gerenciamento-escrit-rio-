"use client";

import { useEffect, useId, useRef, useState } from "react";
import { classeBotaoSecundario } from "@/lib/estilos";
import { useAbertura } from "@/lib/use-abertura";

/** Botão "⋯" com ações menos usadas (ex.: excluir), longe dos botões do dia a dia. */
export function MenuMaisAcoes({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { montado, fechando } = useAbertura(aberto, 140);
  const raiz = useRef<HTMLDivElement>(null);
  const idPainel = useId();

  useEffect(() => {
    if (!aberto) return;
    function fecharSeFora(e: MouseEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    function fecharComEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("click", fecharSeFora);
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.removeEventListener("click", fecharSeFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label="Mais ações"
        title="Mais ações"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((v) => !v)}
        className={`${classeBotaoSecundario} h-full px-3 ${aberto ? "bg-slate-100" : ""}`}
      >
        ⋯
      </button>
      {montado && (
        <div
          id={idPainel}
          className={`absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-superficie p-2 shadow-xl shadow-slate-900/10 ${
            fechando ? "animar-sumir" : "animar-surgir"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
