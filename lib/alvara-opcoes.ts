import { prisma } from "@/lib/prisma";
import { formatarData, formatarMoeda, LABEL_STATUS_SUCUMBENCIA } from "@/lib/formatacao";
import type { OpcaoParcela, OpcaoSucumbencia } from "@/components/alvara-form";

/**
 * Opções dos selects do formulário de alvará: sucumbências e parcelas de
 * honorários de cada processo (pendentes, mais a já quitada por este alvará).
 */
export async function carregarOpcoesAlvara(alvaraId?: string): Promise<{
  sucumbencias: OpcaoSucumbencia[];
  parcelas: OpcaoParcela[];
  parcelaQuitadaIdAtual: string | null;
}> {
  const [sucumbencias, parcelas] = await Promise.all([
    prisma.honorarioSucumbencial.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.parcela.findMany({
      where: {
        OR: [
          { status: { not: "PAGO" } },
          ...(alvaraId ? [{ quitadaPorAlvaraId: alvaraId }] : []),
        ],
      },
      orderBy: [{ honorarioId: "asc" }, { numero: "asc" }],
      include: { honorario: true },
    }),
  ]);

  return {
    sucumbencias: sucumbencias.map((s) => ({
      id: s.id,
      processoId: s.processoId,
      label: `${formatarMoeda(s.valorDefinido ?? s.valorEstimado ?? 0)} · ${LABEL_STATUS_SUCUMBENCIA[s.status] ?? s.status}`,
    })),
    parcelas: parcelas.map((p) => ({
      id: p.id,
      processoId: p.honorario.processoId,
      label: `Parcela ${p.numero} · ${formatarMoeda(p.valor)} · venc. ${formatarData(p.vencimento)}${
        p.honorario.tipo === "EXITO" ? " (êxito)" : ""
      }`,
      percentualExito: p.honorario.percentualExito,
    })),
    parcelaQuitadaIdAtual: alvaraId
      ? (parcelas.find((p) => p.quitadaPorAlvaraId === alvaraId)?.id ?? null)
      : null,
  };
}
