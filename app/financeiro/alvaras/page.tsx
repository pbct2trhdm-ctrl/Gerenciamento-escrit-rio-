import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_STATUS_ALVARA, formatarMoeda, formatarData } from "@/lib/formatacao";
import { DIAS_ALERTA_ALVARA } from "@/lib/financeiro";
import { marcarAlvaraRepassado } from "@/lib/actions/alvaras";
import { tierAlvara } from "@/lib/urgencia";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeBotaoConfirma,
  classeTituloSecao,
} from "@/lib/estilos";

export default async function AlvarasPage() {
  const alvaras = await prisma.alvara.findMany({
    orderBy: { criadoEm: "desc" },
    include: { processo: { include: { cliente: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={classeTituloSecao}>Alvarás</h2>
        <Link href="/financeiro/alvaras/novo" className={classeBotaoPrimario}>
          Novo alvará
        </Link>
      </div>

      {alvaras.length === 0 ? (
        <EmptyState
          mensagem="Nenhum alvará cadastrado."
          acaoHref="/financeiro/alvaras/novo"
          acaoLabel="Adicionar o primeiro alvará"
        />
      ) : (
        <ul className="space-y-3">
          {alvaras.map((alvara) => {
            const tier = tierAlvara(alvara, DIAS_ALERTA_ALVARA);
            return (
              <li key={alvara.id}>
                <div
                  className={`rounded-lg border bg-superficie p-4 ${
                    tier === "critico" ? "border-critico/30" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{alvara.processo.cliente.nome}</p>
                      <p className="text-sm text-texto-secundario truncate tabular-nums">
                        {alvara.processo.numeroProcesso ?? "Sem número"}
                        {alvara.dataRecebimento &&
                          ` · recebido em ${formatarData(alvara.dataRecebimento)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums">
                        {formatarMoeda(alvara.valorTotal)}
                      </p>
                      <p className="text-sm text-texto-secundario tabular-nums">
                        Repassar: {formatarMoeda(alvara.valorRepassado)}
                      </p>
                      <div className="mt-1">
                        <Badge tier={tier}>{LABEL_STATUS_ALVARA[alvara.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/financeiro/alvaras/${alvara.id}/editar`}
                      className={`${classeBotaoSecundario} !px-3 !py-1 text-xs`}
                    >
                      Editar
                    </Link>
                    {alvara.status !== "REPASSADO" && (
                      <form action={marcarAlvaraRepassado.bind(null, alvara.id)}>
                        <button
                          type="submit"
                          className={`${classeBotaoConfirma} !px-3 !py-1 text-xs`}
                        >
                          Marcar como repassado
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
