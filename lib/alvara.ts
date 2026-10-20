/**
 * Demonstrativo do alvará (usado no formulário, ao salvar e na prestação de
 * contas):
 *   valor bruto − IR retido − tarifas            = valor líquido recebido
 *   líquido − honorários contratuais − sucumbência − reembolso de despesas
 *                                                 = valor repassado ao cliente
 * A base sugerida para o % contratual é o crédito do cliente: líquido menos a
 * sucumbência (que pertence ao advogado — Lei 8.906/1994, art. 23).
 */
export type ComposicaoAlvara = {
  valorTotal: number;
  impostoRetido: number;
  tarifas: number;
  honorariosContratuais: number;
  honorariosSucumbencia: number;
  reembolsoDespesas: number;
};

const centavos = (valor: number) => Math.round(valor * 100) / 100;

export function calcularAlvara(c: ComposicaoAlvara) {
  const valorLiquido = centavos(c.valorTotal - c.impostoRetido - c.tarifas);
  const valorRetido = centavos(c.honorariosContratuais + c.honorariosSucumbencia + c.reembolsoDespesas);
  const valorRepassado = centavos(valorLiquido - valorRetido);
  const baseContratual = centavos(valorLiquido - c.honorariosSucumbencia);
  return { valorLiquido, valorRetido, valorRepassado, baseContratual };
}

export function calcularHonorariosContratuais(base: number, percentual: number): number {
  return centavos((base * percentual) / 100);
}
