import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_TIPO_HONORARIO, formatarMoeda, formatarData } from "@/lib/formatacao";
import { statusEfetivoParcela } from "@/lib/financeiro";
import { EmptyState } from "@/components/empty-state";
import { classeBotaoPrimario, classeTituloSecao } from "@/lib/estilos";

export default async function HonorariosPage() {
  const honorarios = await prisma.honorario.findMany({
    orderBy: { dataContrato: "desc" },
    include: {
      processo: { include: { cliente: true } },
      parcelas: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={classeTituloSecao}>Honorários contratuais</h2>
        <Link href="/financeiro/honorarios/novo" className={classeBotaoPrimario}>
          Novo honorário
        </Link>
      </div>

      {honorarios.length === 0 ? (
        <EmptyState
          mensagem="Nenhum honorário cadastrado."
          acaoHref="/financeiro/honorarios/novo"
          acaoLabel="Adicionar o primeiro honorário"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 font-display text-left text-texto-principal">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Contrato</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium text-right">Parcelas</th>
              </tr>
            </thead>
            <tbody>
              {honorarios.map((honorario) => {
                const pagas = honorario.parcelas.filter((p) => p.status === "PAGO").length;
                const atrasadas = honorario.parcelas.filter(
                  (p) => statusEfetivoParcela(p) === "ATRASADO"
                ).length;
                return (
                  <tr
                    key={honorario.id}
                    className="border-b border-gray-100 last:border-0 transition-colors hover:bg-fundo"
                  >
                    <td className="font-medium">
                      <Link
                        href={`/financeiro/honorarios/${honorario.id}`}
                        className="block px-4 py-3"
                      >
                        {honorario.processo.cliente.nome}
                        <span className="block text-xs text-texto-secundario font-normal">
                          {honorario.processo.numeroProcesso ?? "Sem número"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-texto-secundario">
                      {LABEL_TIPO_HONORARIO[honorario.tipo]}
                    </td>
                    <td className="px-4 py-3 text-texto-secundario tabular-nums">
                      {formatarData(honorario.dataContrato)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {honorario.valorTotal != null
                        ? formatarMoeda(honorario.valorTotal)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-texto-secundario tabular-nums">
                      {pagas}/{honorario.parcelas.length} paga(s)
                      {atrasadas > 0 && (
                        <span className="text-critico"> · {atrasadas} atrasada(s)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
