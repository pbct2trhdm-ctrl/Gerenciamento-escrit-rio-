import Link from "next/link";

export type AbaProcesso = { chave: string; rotulo: string; total?: number };

/** Abas da ficha do processo — cada aba é um link (?aba=…), funciona sem JavaScript. */
export function AbasProcesso({
  processoId,
  abaAtual,
  abas,
  caminhoBase = "/processos",
}: {
  processoId: string;
  abaAtual: string;
  abas: AbaProcesso[];
  caminhoBase?: string;
}) {
  return (
    <nav aria-label="Seções do processo" className="mb-5 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-slate-200">
        {abas.map((aba) => {
          const ativa = aba.chave === abaAtual;
          return (
            <li key={aba.chave}>
              <Link
                href={`${caminhoBase}/${processoId}?aba=${aba.chave}`}
                scroll={false}
                aria-current={ativa ? "page" : undefined}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                  ativa
                    ? "border-accent font-semibold text-texto-principal"
                    : "border-transparent text-texto-secundario hover:text-texto-principal"
                }`}
              >
                {aba.rotulo}
                {aba.total !== undefined && (
                  <span className="rounded-full bg-slate-100 px-1.5 text-xs font-medium text-texto-secundario tabular-nums">
                    {aba.total}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
