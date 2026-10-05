import Link from "next/link";
import type { AtualizacaoCliente } from "@/app/generated/prisma/client";
import { formatarData } from "@/lib/formatacao";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import {
  classeBotaoPrimario,
  classeCardHover,
  classeTituloSecao,
} from "@/lib/estilos";

/** Histórico de atualizações ao cliente na tela do processo (judicial ou administrativo). */
export function SecaoAtualizacoesCliente({
  caminhoProcesso,
  atualizacoes,
}: {
  /** Ex.: /processos/abc ou /processos-administrativos/abc */
  caminhoProcesso: string;
  atualizacoes: AtualizacaoCliente[];
}) {
  const novaHref = `${caminhoProcesso}/atualizacoes/nova`;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className={classeTituloSecao}>Atualizações ao cliente</h2>
        <Link href={novaHref} className={classeBotaoPrimario}>
          Nova atualização
        </Link>
      </div>

      {atualizacoes.length === 0 ? (
        <EmptyState
          mensagem="Nenhuma atualização enviada ao cliente. Anexe o PDF do processo e a IA redige a mensagem."
          acaoHref={novaHref}
          acaoLabel="Gerar a primeira atualização"
        />
      ) : (
        <ul className="space-y-3">
          {atualizacoes.map((atualizacao) => (
            <li key={atualizacao.id}>
              <Link
                href={`${caminhoProcesso}/atualizacoes/${atualizacao.id}`}
                className={`block text-sm ${classeCardHover}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-medium tabular-nums">
                    {formatarData(atualizacao.criadoEm)}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tier={atualizacao.whatsappEnviadoEm ? "tranquilo" : "neutro"}>
                      WhatsApp {atualizacao.whatsappEnviadoEm ? "enviado" : "pendente"}
                    </Badge>
                    <Badge tier={atualizacao.emailEnviadoEm ? "tranquilo" : "neutro"}>
                      E-mail {atualizacao.emailEnviadoEm ? "enviado" : "pendente"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-texto-secundario">
                  {atualizacao.resumoInterno ||
                    atualizacao.mensagemWhatsapp ||
                    atualizacao.erroGeracao ||
                    atualizacao.arquivoNome}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
