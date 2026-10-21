/**
 * Identifica alvarás possivelmente cadastrados duas vezes: mesmo processo,
 * mesmo valor bruto e mesma data de recebimento. Retorna os ids de todos os
 * que têm pelo menos um "gêmeo".
 */
export function idsAlvarasDuplicados(
  alvaras: { id: string; processoId: string; valorTotal: number; dataRecebimento: Date | null }[]
): Set<string> {
  const grupos = new Map<string, string[]>();
  for (const a of alvaras) {
    const chave = `${a.processoId}|${a.valorTotal.toFixed(2)}|${a.dataRecebimento?.toISOString().slice(0, 10) ?? "-"}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), a.id]);
  }
  return new Set([...grupos.values()].filter((ids) => ids.length > 1).flat());
}
