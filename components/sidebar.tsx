"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeDashboard,
  IconeClientes,
  IconeProcessos,
  IconePrazos,
  IconeFinanceiro,
  IconeProcessosAdministrativos,
  IconePublicacoes,
  IconeConfiguracoes,
  IconeAgenda,
} from "@/components/icones";
import { BuscaRapida } from "@/components/busca-rapida";
import { useAbertura } from "@/lib/use-abertura";

const itens = [
  { href: "/", label: "Dashboard", Icone: IconeDashboard },
  { href: "/clientes", label: "Clientes", Icone: IconeClientes },
  { href: "/processos", label: "Processos", Icone: IconeProcessos },
  {
    href: "/processos-administrativos",
    label: "Processos Administrativos",
    Icone: IconeProcessosAdministrativos,
  },
  { href: "/agenda", label: "Agenda", Icone: IconeAgenda },
  { href: "/prazos", label: "Prazos", Icone: IconePrazos },
  { href: "/publicacoes", label: "Publicações", Icone: IconePublicacoes },
  { href: "/financeiro", label: "Financeiro", Icone: IconeFinanceiro },
  { href: "/configuracoes", label: "Configurações", Icone: IconeConfiguracoes },
];

/** Atalhos da barra inferior no celular. */
const itensInferiores = [
  { href: "/", label: "Início", Icone: IconeDashboard },
  { href: "/agenda", label: "Agenda", Icone: IconeAgenda },
  { href: "/prazos", label: "Prazos", Icone: IconePrazos },
  { href: "/publicacoes", label: "Publicações", Icone: IconePublicacoes },
  { href: "/processos", label: "Processos", Icone: IconeProcessos },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function ContadorPublicacoes({ total, claro = false }: { total: number; claro?: boolean }) {
  if (total <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[1.25rem] text-center ${
        claro ? "bg-accent text-white" : "bg-white text-base-escura"
      }`}
    >
      {total}
    </span>
  );
}

/**
 * Lista do menu com um destaque que desliza até o item da tela atual
 * (em vez de pular de um item para outro).
 */
function ListaMenu({ pathname, publicacoesNaoLidas }: { pathname: string; publicacoesNaoLidas: number }) {
  const lista = useRef<HTMLUListElement>(null);
  const [indicador, setIndicador] = useState<{ top: number; height: number } | null>(null);
  const indiceAtivo = itens.findIndex((item) => estaAtivo(pathname, item.href));

  useLayoutEffect(() => {
    function medir() {
      const item = lista.current?.children[indiceAtivo + 1] as HTMLElement | undefined;
      const link = item?.firstElementChild as HTMLElement | null | undefined;
      setIndicador(item && link ? { top: item.offsetTop + link.offsetTop, height: link.offsetHeight } : null);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [indiceAtivo]);

  return (
    <ul ref={lista} className="relative flex-1 py-4">
      {/* Destaque deslizante (primeiro filho; os itens vêm depois) */}
      <li
        aria-hidden="true"
        className="indicador-menu pointer-events-none absolute inset-x-3 rounded-lg bg-white/12 shadow-[inset_3px_0_0_white] transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          transform: `translateY(${indicador?.top ?? 0}px)`,
          height: indicador?.height ?? 0,
          opacity: indicador ? 1 : 0,
          top: 0,
        }}
      />
      {itens.map((item) => {
        const ativo = estaAtivo(pathname, item.href);
        return (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`group mx-3 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[color,background-color] duration-200 focus-visible:outline-white ${
                ativo ? "font-semibold text-white" : "font-medium text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`transition-transform duration-200 ${ativo ? "" : "group-hover:translate-x-0.5 group-hover:scale-110"}`}>
                <item.Icone />
              </span>
              <span className="flex-1 transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
              {item.href === "/publicacoes" && <ContadorPublicacoes total={publicacoesNaoLidas} />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Navegação do sistema. No computador: menu lateral fixo. Em telas estreitas
 * (celular ou janela dividida): barra superior com a logo e o nome do
 * escritório sempre visíveis, botão ☰ que abre o menu completo por cima do
 * conteúdo e barra inferior com os atalhos mais usados.
 */
export function Sidebar({ publicacoesNaoLidas = 0 }: { publicacoesNaoLidas?: number }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const gaveta = useAbertura(menuAberto, 220);
  const [rotaDoMenu, setRotaDoMenu] = useState(pathname);

  // Fecha o menu do celular ao trocar de página.
  if (rotaDoMenu !== pathname) {
    setRotaDoMenu(pathname);
    setMenuAberto(false);
  }

  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  return (
    <>
      {/* Computador */}
      <nav className="hidden md:flex w-60 shrink-0 m-3 mr-0 rounded-2xl bg-base-escura shadow-xl shadow-base-escura/25 ring-1 ring-black/5 h-[calc(100vh-1.5rem)] sticky top-3 flex-col overflow-y-auto">
        <Link
          href="/"
          className="flex flex-col items-center gap-3 px-5 py-6 border-b border-white/10 focus-visible:outline-white"
          aria-label="Pastana Mota Advocacia — Dashboard"
        >
          <Image src="/logo-pm-branca.png" alt="" width={600} height={328} priority className="h-auto w-20" />
          <Image
            src="/logo-texto-branca.png"
            alt="Pastana Mota Advocacia"
            width={800}
            height={130}
            priority
            className="h-auto w-44"
          />
        </Link>
        <div className="px-3 pt-4">
          <BuscaRapida id="busca-menu" />
        </div>
        <ListaMenu pathname={pathname} publicacoesNaoLidas={publicacoesNaoLidas} />
      </nav>

      {/* Celular: barra superior com logo e nome do escritório */}
      <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 bg-base-escura px-4 py-2.5 shadow-sm">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Pastana Mota Advocacia — Dashboard">
          <Image src="/logo-pm-branca.png" alt="" width={600} height={328} priority className="h-auto w-11 shrink-0" />
          <Image
            src="/logo-texto-branca.png"
            alt="Pastana Mota Advocacia"
            width={800}
            height={130}
            priority
            className="h-auto w-36 min-w-0"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-celular"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md text-white hover:bg-white/10 focus-visible:outline-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Celular: menu completo por cima do conteúdo */}
      {gaveta.montado && (
        <div className="md:hidden fixed inset-0 z-50 flex p-2">
          <button
            type="button"
            aria-label="Fechar menu"
            className={`absolute inset-0 bg-base-escura/40 backdrop-blur-[2px] ${
              gaveta.fechando ? "animar-esmaecer-sair" : "animar-esmaecer-entrar"
            }`}
            onClick={() => setMenuAberto(false)}
          />
          <nav
            id="menu-celular"
            className={`relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto rounded-2xl bg-base-escura shadow-2xl ${
              gaveta.fechando ? "animar-sair-esquerda" : "animar-entrar-esquerda"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <Image src="/logo-pm-branca.png" alt="" width={600} height={328} className="h-auto w-11" />
                <Image src="/logo-texto-branca.png" alt="Pastana Mota Advocacia" width={800} height={130} className="h-auto w-36" />
              </div>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10 focus-visible:outline-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-3 pt-4">
              <BuscaRapida id="busca-celular" aoNavegar={() => setMenuAberto(false)} />
            </div>
            <ListaMenu pathname={pathname} publicacoesNaoLidas={publicacoesNaoLidas} />
          </nav>
        </div>
      )}

      {/* Celular: atalhos na barra inferior */}
      <nav
        aria-label="Atalhos"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-superficie pb-[env(safe-area-inset-bottom)]"
      >
        {itensInferiores.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                ativo ? "font-semibold text-accent" : "text-texto-secundario"
              }`}
            >
              <item.Icone />
              {item.label}
              {item.href === "/publicacoes" && publicacoesNaoLidas > 0 && (
                <span className="absolute right-[calc(50%-1.4rem)] top-1">
                  <ContadorPublicacoes total={publicacoesNaoLidas} claro />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
