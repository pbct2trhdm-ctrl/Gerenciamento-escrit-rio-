/**
 * Ordenação alfabética em português para as listas de seleção. O SQLite
 * ordena pela tabela de bytes: nomes com acento ("Álvaro", "Érica") iam para
 * o fim e maiúsculas/minúsculas se separavam. Aqui "Á" = "A", sem diferenciar
 * caixa, e números em ordem natural.
 */
const colador = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

export function ordenarPorNome<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => colador.compare(a.nome, b.nome));
}

/** Processos pelo nome do cliente e, no mesmo cliente, pelo número. */
export function ordenarProcessosPorCliente<
  T extends { cliente: { nome: string }; numeroProcesso: string | null },
>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      colador.compare(a.cliente.nome, b.cliente.nome) ||
      colador.compare(a.numeroProcesso ?? "", b.numeroProcesso ?? "")
  );
}
