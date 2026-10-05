"use client";

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
} from "@/components/icones";

const itens = [
  { href: "/", label: "Dashboard", Icone: IconeDashboard },
  { href: "/clientes", label: "Clientes", Icone: IconeClientes },
  { href: "/processos", label: "Processos", Icone: IconeProcessos },
  {
    href: "/processos-administrativos",
    label: "Processos Administrativos",
    Icone: IconeProcessosAdministrativos,
  },
  { href: "/prazos", label: "Prazos/Agenda", Icone: IconePrazos },
  { href: "/publicacoes", label: "Publicações", Icone: IconePublicacoes },
  { href: "/financeiro", label: "Financeiro", Icone: IconeFinanceiro },
  { href: "/configuracoes", label: "Configurações", Icone: IconeConfiguracoes },
];

export function Sidebar({ publicacoesNaoLidas = 0 }: { publicacoesNaoLidas?: number }) {
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-black/10 bg-base-escura min-h-screen flex flex-col">
      <Link
        href="/"
        className="flex flex-col items-center gap-3 px-5 py-6 border-b border-white/10 focus-visible:outline-white"
        aria-label="Pastana Mota Advocacia — Dashboard"
      >
        <Image
          src="/logo-pm-branca.png"
          alt=""
          width={600}
          height={328}
          priority
          className="h-auto w-20"
        />
        <Image
          src="/logo-texto-branca.png"
          alt="Pastana Mota Advocacia"
          width={800}
          height={130}
          priority
          className="h-auto w-44"
        />
      </Link>
      <ul className="flex-1 py-4">
        {itens.map((item) => {
          const ativo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 mx-3 mb-1 rounded-md py-2 text-sm transition-colors focus-visible:outline-white ${
                  ativo
                    ? "border-l-[3px] border-white bg-white/10 pl-[9px] pr-3 font-semibold text-white"
                    : "px-3 font-medium text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.Icone />
                <span className="flex-1">{item.label}</span>
                {item.href === "/publicacoes" && publicacoesNaoLidas > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold text-base-escura min-w-[1.25rem] text-center">
                    {publicacoesNaoLidas}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
