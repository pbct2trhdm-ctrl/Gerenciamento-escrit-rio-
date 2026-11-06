import Link from "next/link";
import { buscarGeral, LABEL_TIPO_RESULTADO } from "@/lib/busca";
import { EmptyState } from "@/components/empty-state";
import { classeInput, classeBotaoPrimario, classeTituloPagina, classeBadgeNeutro } from "@/lib/estilos";

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const resultados = q.trim().length >= 2 ? await buscarGeral(q, 50) : [];

  return (
    <div className="max-w-6xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Busca</h1>
      <form action="/busca" className="flex gap-3 mb-6">
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Nome do cliente, número do processo ou protocolo"
          className={classeInput}
        />
        <button type="submit" className={classeBotaoPrimario}>
          Buscar
        </button>
      </form>

      {q.trim().length < 2 ? (
        <p className="text-sm text-texto-secundario">Digite ao menos 2 letras ou 4 números.</p>
      ) : resultados.length === 0 ? (
        <EmptyState mensagem={`Nada encontrado para "${q}".`} />
      ) : (
        <ul className="rounded-xl border border-slate-200 bg-superficie divide-y divide-slate-100">
          {resultados.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-start gap-3 px-4 py-3 hover:bg-fundo">
                <span className={`${classeBadgeNeutro} mt-0.5 w-24 justify-center shrink-0`}>
                  {LABEL_TIPO_RESULTADO[r.tipo]}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-texto-principal">{r.titulo}</span>
                  <span className="block text-sm text-texto-secundario truncate">{r.detalhe}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
