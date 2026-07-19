"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/processos", label: "Processos" },
  { href: "/prazos", label: "Prazos/Agenda" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-gray-200 bg-white min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-gray-200">
        <p className="font-semibold text-sm leading-tight">
          Pastana Mota
        </p>
        <p className="text-xs text-gray-500 leading-tight">
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
                className={`block mx-3 mb-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
