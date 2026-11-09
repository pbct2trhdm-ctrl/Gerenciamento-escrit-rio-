"use client";

import { useEffect, useState } from "react";
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

function ListaMenu({ pathname, publicacoesNaoLidas }: { pathname: string; publicacoesNaoLidas: number }) {
  return (
    <ul className="flex-1 py-4">
      {itens.map((item) => {
        const ativo = estaAtivo(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center gap-3 mx-3 mb-1 rounded-md py-2 text-sm transition-colors focus-visible:outline-white ${
                ativo
                  ? "border-l-[3px] border-white bg-white/10 pl-[9px] pr-3 font-semibold text-white"
                  : "px-3 font-medium text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.Icone />
              <span className="flex-1">{item.label}</span>
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
      <nav className="hidden md:flex w-60 shrink-0 border-r border-black/10 bg-base-escura h-screen sticky top-0 flex-col overflow-y-auto">
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
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
          />
          <nav
            id="menu-celular"
            className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-base-escura"
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
