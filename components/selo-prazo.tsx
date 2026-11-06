import { TIER_COR, TIER_COR_FUNDO, type Tier } from "@/lib/urgencia";

const TEXTO_SELO: Record<Tier, string> = {
  critico: "URGENTE",
  atencao: "ATENÇÃO",
  tranquilo: "EM DIA",
  neutro: "PRAZO",
};

/**
 * Selo circular estilo carimbo de protocolo — componente de assinatura visual
 * do sistema. `id` precisa ser único na página (ex.: id do prazo) porque o
 * texto curvo depende de um <path> referenciado por href. Prazo cumprido ou
 * perdido mostra o desfecho (✓ / ✕) em vez da contagem de dias, que não faz
 * mais sentido depois de encerrado.
 */
export function SeloPrazo({
  id,
  dias,
  tier,
  status = "PENDENTE",
  size = 92,
}: {
  id: string;
  dias: number;
  tier: Tier;
  status?: string;
  size?: number;
}) {
  const cumprido = status === "CUMPRIDO";
  const perdido = status === "PERDIDO";
  const encerrado = cumprido || perdido;
  const cor = cumprido ? TIER_COR.neutro : TIER_COR[tier];
  const corFundo = cumprido ? TIER_COR_FUNDO.neutro : TIER_COR_FUNDO[tier];
  const arcoId = `selo-arco-${id}`;
  const atrasado = dias < 0;
  // Em tamanho pequeno (listas compactas) só o número cabe com legibilidade.
  const compacto = size < 60;
  const textoArco = cumprido ? "CUMPRIDO" : perdido ? "PERDIDO" : TEXTO_SELO[tier];

  const descricao = cumprido
    ? "Prazo cumprido"
    : perdido
      ? "Prazo perdido"
      : `${TEXTO_SELO[tier]}: ${
          atrasado ? `${Math.abs(dias)} dias em atraso` : dias === 0 ? "vence hoje" : `${dias} dias restantes`
        }`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={descricao}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {/* Anel externo pontilhado, estilo carimbo notarial */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={cor}
          strokeWidth="1.5"
          strokeDasharray={encerrado ? undefined : "3 2"}
        />
        <circle cx="50" cy="50" r="41" fill={corFundo} stroke={cor} strokeWidth="1" />
        <path id={arcoId} d="M 14 55 A 36 36 0 1 1 86 55" fill="none" />
        {!compacto && (
          <text fontSize="7.5" fontWeight="700" letterSpacing="1.5" fill={cor}>
            <textPath href={`#${arcoId}`} startOffset="50%" textAnchor="middle">
              {textoArco}
            </textPath>
          </text>
        )}
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${compacto ? "" : "pt-1"}`}>
        <span
          className={`font-display font-bold leading-none tabular-nums ${compacto ? "text-lg" : "text-2xl"}`}
          style={{ color: cor }}
        >
          {cumprido ? "✓" : perdido ? "✕" : Math.abs(dias)}
        </span>
        {!encerrado && !compacto && (
          <span className="mt-1 text-[9px] uppercase tracking-wide text-texto-secundario">
            {atrasado ? "atraso" : dias === 0 ? "hoje" : dias === 1 ? "dia" : "dias"}
          </span>
        )}
      </div>
    </div>
  );
}
