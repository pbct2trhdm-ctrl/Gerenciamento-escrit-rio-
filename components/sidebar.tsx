"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeDashboard,
  IconeClientes,
  IconeProcessos,
  IconePrazos,
  IconeFinanceiro,
} from "@/components/icones";

const itens = [
  { href: "/", label: "Dashboard", Icone: IconeDashboard },
  { href: "/clientes", label: "Clientes", Icone: IconeClientes },
  { href: "/processos", label: "Processos", Icone: IconeProcessos },
  { href: "/prazos", label: "Prazos/Agenda", Icone: IconePrazos },
  { href: "/financeiro", label: "Financeiro", Icone: IconeFinanceiro },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-black/10 bg-base-escura min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="font-display text-base font-semibold leading-tight text-white">
          Pastana Mota
        </p>
        <p className="text-xs text-white/55 leading-tight mt-0.5">
          Sociedade Individual de Advocacia
        </p>
      </div>
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
                className={`flex items-center gap-3 mx-3 mb-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-accent text-base-escura"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.Icone />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
