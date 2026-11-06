import Link from "next/link";
import { LABEL_MODALIDADE_AUDIENCIA, formatarData, formatarHorario } from "@/lib/formatacao";
import { TIER_CLASSES, CLASSE_BADGE_AUDIENCIA, type Tier } from "@/lib/urgencia";
import { tituloPrazo, textoDiasRestantes } from "@/lib/exibicao-prazo";
import { SeloPrazo } from "@/components/selo-prazo";
import { SeloAConferir, BotaoConfirmarPrazo } from "@/components/prazo-a-conferir";

const DIA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

type PrazoDaLinha = {
  id: string;
  tipo: string;
  observacoes: string | null;
  dataFinal: Date;
  aConferir: boolean;
  modalidadeAudiencia: string | null;
  processoId: string;
  processo: {
    numeroProcesso: string | null;
    vara: string | null;
    cliente: { nome: string };
  };
};

/**
 * Linha compacta de prazo (Dashboard): a linha inteira abre o processo; o
 * botão "Confirmar" dos prazos a conferir fica por cima do link.
 */
export function LinhaPrazo({ prazo, dias, tier }: { prazo: PrazoDaLinha; dias: number; tier: Tier }) {
  const ehAudiencia = prazo.tipo === "AUDIENCIA";
  const { titulo, tipoSeparado } = tituloPrazo(prazo);
  const data = `${DIA_SEMANA.format(prazo.dataFinal).replace(".", "")}, ${formatarData(prazo.dataFinal)}`;

  return (
    <li className="relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-fundo">
      <SeloPrazo id={prazo.id} dias={dias} tier={tier} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/processos/${prazo.processoId}`}
            className="font-semibold text-texto-principal after:absolute after:inset-0 after:content-['']"
          >
            {titulo}
            {ehAudiencia && ` · ${formatarHorario(prazo.dataFinal)}`}
          </Link>
          {tipoSeparado && <span className="text-xs text-texto-secundario">{tipoSeparado}</span>}
          {ehAudiencia && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CLASSE_BADGE_AUDIENCIA}`}>
              {prazo.modalidadeAudiencia ? LABEL_MODALIDADE_AUDIENCIA[prazo.modalidadeAudiencia] : "Audiência"}
            </span>
          )}
          {prazo.aConferir && <SeloAConferir />}
        </div>
        <p className="mt-0.5 truncate text-xs text-texto-secundario">
          <span className="font-medium text-texto-principal">{prazo.processo.cliente.nome}</span>
          {" · "}
          <span className="font-mono">{prazo.processo.numeroProcesso ?? "sem número"}</span>
          {prazo.processo.vara && ` · ${prazo.processo.vara}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_CLASSES[tier]}`}>
          {textoDiasRestantes(dias)}
        </span>
        <span className="hidden text-xs text-texto-secundario sm:block">{data}</span>
        {prazo.aConferir && (
          <div className="relative z-10">
            <BotaoConfirmarPrazo prazoId={prazo.id} />
          </div>
        )}
      </div>
    </li>
  );
}
