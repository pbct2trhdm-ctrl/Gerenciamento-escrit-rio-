import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pastana Mota Advocacia — Gestão de Escritório",
  description: "Gestão de clientes, processos e prazos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicacoesNaoLidas = await prisma.publicacao.count({ where: { lida: false } });

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-fundo text-texto-principal font-sans">
        <Sidebar publicacoesNaoLidas={publicacoesNaoLidas} />
        <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
      </body>
    </html>
  );
}
