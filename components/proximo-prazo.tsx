import Link from "next/link";
import { diasRestantes } from "@/lib/prazos";
import { tierPorDiasRestantes, TIER_CLASSES, CLASSE_BADGE_AUDIENCIA } from "@/lib/urgencia";

const DIA_MES = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Selo compacto do próximo prazo pendente (listas de processos e clientes). */
export function ProximoPrazo({ prazo }: { prazo?: { id: string; dataFinal: Date; tipo: string } }) {
  if (!prazo) return <span className="text-texto-secundario">—</span>;
  const dias = diasRestantes(prazo.dataFinal);
  const audiencia = prazo.tipo === "AUDIENCIA";
  const classe = audiencia ? CLASSE_BADGE_AUDIENCIA : TIER_CLASSES[tierPorDiasRestantes(dias)];
  const texto = dias < 0 ? `atrasado ${DIA_MES.format(prazo.dataFinal)}` : dias === 0 ? "hoje" : DIA_MES.format(prazo.dataFinal);
  return (
    <Link
      href={`/prazos/${prazo.id}`}
      className={`relative z-10 inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${classe}`}
    >
      {texto}
      {audiencia && " · audiência"}
    </Link>
  );
}
