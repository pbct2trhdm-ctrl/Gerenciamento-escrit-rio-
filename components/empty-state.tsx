import Link from "next/link";
import { classeBotaoPrimario } from "@/lib/estilos";

export function EmptyState({
  mensagem,
  acaoHref,
  acaoLabel,
}: {
  mensagem: string;
  acaoHref?: string;
  acaoLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-superficie/60 p-8 text-center">
      <p className="text-sm text-texto-secundario mb-4">{mensagem}</p>
      {acaoHref && acaoLabel && (
        <Link href={acaoHref} className={classeBotaoPrimario}>
          {acaoLabel}
        </Link>
      )}
    </div>
  );
}
