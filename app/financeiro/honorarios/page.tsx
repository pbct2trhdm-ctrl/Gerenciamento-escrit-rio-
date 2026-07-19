import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LABEL_TIPO_HONORARIO, formatarMoeda, formatarData } from "@/lib/formatacao";
import { statusEfetivoParcela } from "@/lib/financeiro";

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
        <h2 className="text-lg font-medium">Honorários contratuais</h2>
        <Link
          href="/financeiro/honorarios/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo honorário
        </Link>
      </div>

      {honorarios.length === 0 ? (
        <p className="text-gray-500">Nenhum honorário cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {honorarios.map((honorario) => {
            const pagas = honorario.parcelas.filter((p) => p.status === "PAGO").length;
            const atrasadas = honorario.parcelas.filter(
              (p) => statusEfetivoParcela(p) === "ATRASADO"
            ).length;
            return (
              <li key={honorario.id}>
                <Link
                  href={`/financeiro/honorarios/${honorario.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {honorario.processo.cliente.nome}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {LABEL_TIPO_HONORARIO[honorario.tipo]} ·{" "}
                        {honorario.processo.numeroProcesso ?? "Sem número"} ·{" "}
                        {formatarData(honorario.dataContrato)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {honorario.valorTotal != null
                          ? formatarMoeda(honorario.valorTotal)
                          : "—"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {honorario.parcelas.length} parcela(s) · {pagas} paga(s)
                        {atrasadas > 0 && (
                          <span className="text-red-600"> · {atrasadas} atrasada(s)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
