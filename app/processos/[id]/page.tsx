import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LABEL_AREA,
  LABEL_STATUS_PROCESSO,
  LABEL_TIPO_PRAZO,
  LABEL_CONTAGEM,
  LABEL_STATUS_PRAZO,
  LABEL_TIPO_HONORARIO,
  LABEL_STATUS_SUCUMBENCIA,
  LABEL_STATUS_ALVARA,
  formatarData,
  formatarMoeda,
} from "@/lib/formatacao";
import { diasRestantes } from "@/lib/prazos";
import { excluirProcesso } from "@/lib/actions/processos";
import { marcarPrazoComoCumprido } from "@/lib/actions/prazos";

export default async function ProcessoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      cliente: true,
      prazos: { orderBy: { dataFinal: "asc" } },
      honorarios: { orderBy: { dataContrato: "desc" } },
      honorariosSucumbenciais: { orderBy: { criadoEm: "desc" } },
      alvaras: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!processo) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">
          {processo.numeroProcesso ?? "Processo sem número"}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/processos/${processo.id}/editar`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Editar
          </Link>
          <form action={excluirProcesso.bind(null, processo.id)}>
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Excluir
            </button>
          </form>
        </div>
      </div>
      <p className="text-gray-500 mb-6">
        <Link href={`/clientes/${processo.cliente.id}`} className="underline">
          {processo.cliente.nome}
        </Link>{" "}
        · {LABEL_AREA[processo.area]} · {LABEL_STATUS_PROCESSO[processo.status]}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div>
          <p className="text-gray-500">Vara/Tribunal</p>
          <p>{processo.varaTribunal || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Criado em</p>
          <p>{formatarData(processo.criadoEm)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Resumo</p>
          <p className="whitespace-pre-wrap">{processo.resumo || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Prazos vinculados</h2>
        <Link
          href={`/prazos/novo?processoId=${processo.id}`}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo prazo
        </Link>
      </div>

      {processo.prazos.length === 0 ? (
        <p className="text-gray-500">Nenhum prazo vinculado.</p>
      ) : (
        <ul className="space-y-2">
          {processo.prazos.map((prazo) => {
            const restantes = diasRestantes(prazo.dataFinal);
            const urgente = prazo.status === "PENDENTE" && restantes <= 7;
            return (
              <li key={prazo.id}>
                <div
                  className={`rounded-lg border p-4 ${
                    urgente
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {LABEL_TIPO_PRAZO[prazo.tipo]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatarData(prazo.dataBase)} + {prazo.dias} dia(s) (
                        {LABEL_CONTAGEM[prazo.contagem]})
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          urgente ? "text-red-700" : "text-gray-900"
                        }`}
                      >
                        {formatarData(prazo.dataFinal)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {LABEL_STATUS_PRAZO[prazo.status]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/prazos/${prazo.id}/editar`}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    {prazo.status === "PENDENTE" && (
                      <form action={marcarPrazoComoCumprido.bind(null, prazo.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          Marcar como cumprido
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

      <div className="mt-10 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Honorários contratuais</h2>
            <Link
              href={`/financeiro/honorarios/novo?processoId=${processo.id}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Novo honorário
            </Link>
          </div>
          {processo.honorarios.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum honorário cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.honorarios.map((honorario) => (
                <li key={honorario.id}>
                  <Link
                    href={`/financeiro/honorarios/${honorario.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm hover:bg-gray-50"
                  >
                    <span>{LABEL_TIPO_HONORARIO[honorario.tipo]}</span>
                    <span>
                      {honorario.valorTotal != null
                        ? formatarMoeda(honorario.valorTotal)
                        : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Sucumbência</h2>
            <Link
              href={`/financeiro/sucumbencia/novo?processoId=${processo.id}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Nova sucumbência
            </Link>
          </div>
          {processo.honorariosSucumbenciais.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum registro cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.honorariosSucumbenciais.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/financeiro/sucumbencia/${s.id}/editar`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm hover:bg-gray-50"
                  >
                    <span>{LABEL_STATUS_SUCUMBENCIA[s.status]}</span>
                    <span>
                      {s.valorDefinido != null
                        ? formatarMoeda(s.valorDefinido)
                        : s.valorEstimado != null
                          ? `~ ${formatarMoeda(s.valorEstimado)}`
                          : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Alvarás</h2>
            <Link
              href={`/financeiro/alvaras/novo?processoId=${processo.id}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Novo alvará
            </Link>
          </div>
          {processo.alvaras.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum alvará cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {processo.alvaras.map((alvara) => (
                <li key={alvara.id}>
                  <Link
                    href={`/financeiro/alvaras/${alvara.id}/editar`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm hover:bg-gray-50"
                  >
                    <span>{LABEL_STATUS_ALVARA[alvara.status]}</span>
                    <span>{formatarMoeda(alvara.valorTotal)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
