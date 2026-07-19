import { TIER_COR, type Tier } from "@/lib/urgencia";

const TEXTO_SELO: Record<Tier, string> = {
  critico: "URGENTE",
  atencao: "PRAZO BREVE",
  tranquilo: "DENTRO DO PRAZO",
  neutro: "PRAZO",
};

/**
 * Selo circular estilo carimbo de protocolo — componente de assinatura visual
 * do sistema. `id` precisa ser único na página (ex.: id do prazo) porque o
 * texto curvo depende de um <path> referenciado por href.
 */
export function SeloPrazo({
  id,
  dias,
  tier,
  size = 92,
}: {
  id: string;
  dias: number;
  tier: Tier;
  size?: number;
}) {
  const cor = TIER_COR[tier];
  const arcoId = `selo-arco-${id}`;
  const atrasado = dias < 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${TEXTO_SELO[tier]}: ${
        atrasado ? `${Math.abs(dias)} dias em atraso` : `${dias} dias restantes`
      }`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r="47" fill="none" stroke={cor} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="41" fill="none" stroke={cor} strokeWidth="1" />
        <path id={arcoId} d="M 14 55 A 36 36 0 1 1 86 55" fill="none" />
        <text fontSize="7.5" fontWeight="700" letterSpacing="1.5" fill={cor}>
          <textPath href={`#${arcoId}`} startOffset="50%" textAnchor="middle">
            {TEXTO_SELO[tier]}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span
          className="font-display text-2xl font-bold leading-none tabular-nums"
          style={{ color: cor }}
        >
          {Math.abs(dias)}
        </span>
        <span className="mt-1 text-[9px] uppercase tracking-wide text-texto-secundario">
          {atrasado ? "dias em atraso" : dias === 0 ? "vence hoje" : "dia(s)"}
        </span>
      </div>
    </div>
  );
}
