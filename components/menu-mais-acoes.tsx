"use client";

import { useEffect, useRef } from "react";
import { classeBotaoSecundario } from "@/lib/estilos";

/** Botão "⋯" com ações menos usadas (ex.: excluir), longe dos botões do dia a dia. */
export function MenuMaisAcoes({ children }: { children: React.ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function fecharSeFora(e: MouseEvent) {
      if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false;
    }
    document.addEventListener("click", fecharSeFora);
    return () => document.removeEventListener("click", fecharSeFora);
  }, []);

  return (
    <details ref={menu} className="relative">
      <summary
        aria-label="Mais ações"
        title="Mais ações"
        className={`${classeBotaoSecundario} h-full cursor-pointer list-none px-3 [&::-webkit-details-marker]:hidden`}
      >
        ⋯
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-72 rounded-lg border border-slate-200 bg-superficie p-2 shadow-lg">
        {children}
      </div>
    </details>
  );
}
