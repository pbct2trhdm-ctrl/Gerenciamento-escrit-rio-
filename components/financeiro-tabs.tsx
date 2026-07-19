"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const abas = [
  { href: "/financeiro", label: "Visão Geral" },
  { href: "/financeiro/honorarios", label: "Honorários" },
  { href: "/financeiro/sucumbencia", label: "Sucumbência" },
  { href: "/financeiro/alvaras", label: "Alvarás" },
  { href: "/financeiro/despesas", label: "Despesas" },
  { href: "/financeiro/obrigacoes", label: "Obrigações do Sócio" },
];

export function FinanceiroTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex flex-wrap gap-1 -mb-px">
        {abas.map((aba) => {
          const ativo =
            aba.href === "/financeiro"
              ? pathname === "/financeiro"
              : pathname.startsWith(aba.href);
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                ativo
                  ? "border-accent text-accent"
                  : "border-transparent text-texto-secundario hover:text-texto-principal"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
