import { confirmarPrazo } from "@/lib/actions/prazos";
import { BotaoEnvio } from "@/components/botao-envio";

/** Selo "A conferir" dos prazos gerados automaticamente da publicação do DJEN. */
export function SeloAConferir() {
  return (
    <span
      title="Prazo gerado automaticamente da publicação do DJEN — confira tipo, contagem e vencimento"
      className="inline-flex items-center rounded-full border border-atencao/40 bg-atencao-fundo px-2 py-0.5 text-xs font-medium text-atencao shrink-0"
    >
      A conferir
    </span>
  );
}

/** Botão que confirma o prazo gerado (remove o selo "A conferir"). */
export function BotaoConfirmarPrazo({ prazoId }: { prazoId: string }) {
  return (
    <form action={confirmarPrazo.bind(null, prazoId)}>
      <BotaoEnvio
        textoAguardando="Confirmando…"
        className="inline-flex items-center rounded-md border border-atencao/40 bg-atencao-fundo px-3 py-1.5 text-xs font-semibold text-atencao transition-colors hover:bg-amber-100"
      >
        Confirmar prazo
      </BotaoEnvio>
    </form>
  );
}
