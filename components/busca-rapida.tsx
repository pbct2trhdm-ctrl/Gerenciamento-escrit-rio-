"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResultadoBusca } from "@/lib/busca";
import { useAbertura } from "@/lib/use-abertura";

const LABEL_TIPO: Record<ResultadoBusca["tipo"], string> = {
  cliente: "Cliente",
  processo: "Processo",
  administrativo: "Adm.",
  publicacao: "Publicação",
};

/**
 * Campo de busca do menu. ⌘K (ou Ctrl+K) foca o campo de qualquer tela;
 * setas escolhem o resultado e Enter abre. Enter sem resultado escolhido
 * abre a página /busca com a lista completa.
 */
export function BuscaRapida({ aoNavegar, id }: { aoNavegar?: () => void; id: string }) {
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [selecionado, setSelecionado] = useState(0);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const elemento = campo.current;
        // Só o campo visível (há um no menu do computador e outro no do celular).
        if (!elemento || elemento.offsetParent === null) return;
        e.preventDefault();
        elemento.focus();
        elemento.select();
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < 2) return;
    const controle = new AbortController();
    const espera = setTimeout(() => {
      fetch(`/api/busca?q=${encodeURIComponent(consulta)}`, { signal: controle.signal })
        .then((r) => r.json())
        .then((dados: { resultados: ResultadoBusca[] }) => {
          setResultados(dados.resultados);
          setSelecionado(0);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [texto]);

  const lista = texto.trim().length >= 2 ? resultados : [];
  const painel = useAbertura(aberto && texto.trim().length >= 2, 140);

  function abrir(href: string) {
    setAberto(false);
    setTexto("");
    setResultados([]);
    campo.current?.blur();
    aoNavegar?.();
    router.push(href);
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelecionado((s) => Math.min(s + 1, lista.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelecionado((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (lista[selecionado]) abrir(lista[selecionado].href);
      else if (texto.trim()) abrir(`/busca?q=${encodeURIComponent(texto.trim())}`);
    } else if (e.key === "Escape") {
      setAberto(false);
      campo.current?.blur();
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Buscar cliente ou processo
      </label>
      <input
        ref={campo}
        id={id}
        type="search"
        value={texto}
        autoComplete="off"
        placeholder="Buscar…"
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={teclas}
        className="w-full rounded-md border border-white/15 bg-white/10 py-2 pl-3 pr-12 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/60"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/20 px-1.5 text-[10px] text-white/50 hidden md:block">
        ⌘K
      </kbd>
      {painel.montado && (
        <div
          style={{ transformOrigin: "top left" }}
          className={`absolute left-0 z-50 mt-2 w-full md:w-[26rem] overflow-hidden rounded-xl border border-slate-200 bg-superficie text-texto-principal shadow-xl shadow-slate-900/15 ${
            painel.fechando ? "animar-sumir" : "animar-surgir"
          }`}
        >
          {lista.length === 0 ? (
            <p className="px-3 py-3 text-sm text-texto-secundario">Nada encontrado ainda…</p>
          ) : (
            <ul role="listbox" aria-label="Resultados da busca">
              {lista.slice(0, 10).map((r, i) => (
                <li key={r.href} role="option" aria-selected={i === selecionado}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => abrir(r.href)}
                    onMouseEnter={() => setSelecionado(i)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${i === selecionado ? "bg-slate-100" : ""}`}
                  >
                    <span className="mt-0.5 w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-texto-secundario">
                      {LABEL_TIPO[r.tipo]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{r.titulo}</span>
                      <span className="block truncate text-xs text-texto-secundario">{r.detalhe}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => abrir(`/busca?q=${encodeURIComponent(texto.trim())}`)}
            className="block w-full border-t border-slate-100 px-3 py-2 text-left text-xs text-accent hover:bg-fundo"
          >
            Ver todos os resultados para “{texto.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
