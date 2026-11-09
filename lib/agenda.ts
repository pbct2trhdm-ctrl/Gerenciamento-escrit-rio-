import { prisma } from "@/lib/prisma";

/**
 * Agenda do escritório: reuniões e diligências (Compromisso) e, junto com
 * elas, as audiências e os prazos que vencem no dia. Todas as datas usam a
 * convenção "hora de parede em UTC" (09:00 → 09:00Z), como as audiências.
 */

export type ItemAgenda = {
  id: string;
  origem: "compromisso" | "audiencia";
  tipo: "REUNIAO" | "DILIGENCIA" | "AUDIENCIA";
  titulo: string;
  inicio: Date;
  fim: Date | null;
  local: string | null;
  link: string | null;
  status: string;
  observacoes: string | null;
  cliente: { id: string; nome: string } | null;
  processo: { id: string; numeroProcesso: string | null } | null;
  href: string;
};

/** "AAAA-MM-DD" de hoje no relógio do computador que roda o sistema. */
export function hojeIso(agora: Date = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Converte "AAAA-MM-DD" no início do dia (UTC de parede); inválido → null. */
export function diaDeIso(texto: string | undefined): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? "");
  if (!partes) return null;
  const data = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  return Number.isNaN(data.getTime()) || data.getUTCDate() !== Number(partes[3]) ? null : data;
}

export function isoDeDia(dia: Date): string {
  return dia.toISOString().slice(0, 10);
}

export function somarDias(dia: Date, dias: number): Date {
  return new Date(dia.getTime() + dias * 86_400_000);
}

/** Itens da agenda (compromissos e audiências) com início em [de, ate). */
export async function itensDaAgenda(de: Date, ate: Date): Promise<ItemAgenda[]> {
  const [compromissos, audiencias] = await Promise.all([
    prisma.compromisso.findMany({
      where: { inicio: { gte: de, lt: ate } },
      orderBy: { inicio: "asc" },
      include: {
        cliente: { select: { id: true, nome: true } },
        processo: { select: { id: true, numeroProcesso: true, cliente: { select: { id: true, nome: true } } } },
      },
    }),
    prisma.prazo.findMany({
      where: { tipo: "AUDIENCIA", status: { not: "PERDIDO" }, dataFinal: { gte: de, lt: ate } },
      orderBy: { dataFinal: "asc" },
      include: {
        processo: { select: { id: true, numeroProcesso: true, vara: true, cliente: { select: { id: true, nome: true } } } },
      },
    }),
  ]);

  const itens: ItemAgenda[] = [
    ...compromissos.map((c) => ({
      id: c.id,
      origem: "compromisso" as const,
      tipo: c.tipo,
      titulo: c.titulo,
      inicio: c.inicio,
      fim: c.fim,
      local: c.local,
      link: c.link,
      status: c.status,
      observacoes: c.observacoes,
      cliente: c.cliente ?? c.processo?.cliente ?? null,
      processo: c.processo ? { id: c.processo.id, numeroProcesso: c.processo.numeroProcesso } : null,
      href: `/agenda/${c.id}/editar`,
    })),
    ...audiencias.map((a) => ({
      id: a.id,
      origem: "audiencia" as const,
      tipo: "AUDIENCIA" as const,
      titulo: a.observacoes?.startsWith("Audiência captada") || !a.observacoes ? "Audiência" : a.observacoes.split("\n")[0],
      inicio: a.dataFinal,
      fim: null,
      local: a.processo.vara,
      link: a.linkAudiencia,
      status: a.status === "CUMPRIDO" ? "REALIZADO" : "AGENDADO",
      observacoes: null,
      cliente: a.processo.cliente,
      processo: { id: a.processo.id, numeroProcesso: a.processo.numeroProcesso },
      href: `/prazos/${a.id}`,
    })),
  ];
  return itens.sort((x, y) => x.inicio.getTime() - y.inicio.getTime());
}

/** Prazos (não audiências) pendentes que vencem no dia. */
export async function prazosQueVencemNoDia(dia: Date) {
  return prisma.prazo.findMany({
    where: { tipo: { not: "AUDIENCIA" }, status: "PENDENTE", dataFinal: { gte: dia, lt: somarDias(dia, 1) } },
    orderBy: { dataFinal: "asc" },
    include: { processo: { select: { id: true, numeroProcesso: true, cliente: { select: { nome: true } } } } },
  });
}
