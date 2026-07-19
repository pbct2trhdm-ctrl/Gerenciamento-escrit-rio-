export type TipoContagem = "DIAS_UTEIS" | "DIAS_CORRIDOS";

function dataPascoa(ano: number): Date {
  // Algoritmo de Meeus/Jones/Butcher (calendário gregoriano)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function addDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function chaveData(data: Date): string {
  return `${data.getUTCFullYear()}-${data.getUTCMonth()}-${data.getUTCDate()}`;
}

function feriadosNacionais(ano: number): Set<string> {
  const pascoa = dataPascoa(ano);
  const feriados = [
    new Date(Date.UTC(ano, 0, 1)), // Confraternização Universal
    new Date(Date.UTC(ano, 3, 21)), // Tiradentes
    new Date(Date.UTC(ano, 4, 1)), // Dia do Trabalho
    new Date(Date.UTC(ano, 8, 7)), // Independência
    new Date(Date.UTC(ano, 9, 12)), // Nossa Senhora Aparecida
    new Date(Date.UTC(ano, 10, 2)), // Finados
    new Date(Date.UTC(ano, 10, 15)), // Proclamação da República
    new Date(Date.UTC(ano, 10, 20)), // Dia Nacional de Zumbi e da Consciência Negra
    new Date(Date.UTC(ano, 11, 25)), // Natal
    addDias(pascoa, -48), // Segunda-feira de Carnaval
    addDias(pascoa, -47), // Terça-feira de Carnaval
    addDias(pascoa, -2), // Sexta-feira Santa
    addDias(pascoa, 60), // Corpus Christi
  ];
  return new Set(feriados.map(chaveData));
}

function ehFeriado(data: Date, cache: Map<number, Set<string>>): boolean {
  const ano = data.getUTCFullYear();
  if (!cache.has(ano)) {
    cache.set(ano, feriadosNacionais(ano));
  }
  return cache.get(ano)!.has(chaveData(data));
}

function ehFimDeSemana(data: Date): boolean {
  const diaSemana = data.getUTCDay();
  return diaSemana === 0 || diaSemana === 6;
}

/**
 * Calcula a data final de um prazo a partir da data base, quantidade de dias e tipo de contagem.
 * Em dias úteis, pula fins de semana e feriados nacionais (fixos e móveis).
 */
export function calcularDataFinal(
  dataBase: Date,
  dias: number,
  contagem: TipoContagem
): Date {
  if (contagem === "DIAS_CORRIDOS") {
    return addDias(dataBase, dias);
  }

  const cacheFeriados = new Map<number, Set<string>>();
  let atual = new Date(dataBase);
  let restantes = dias;

  while (restantes > 0) {
    atual = addDias(atual, 1);
    if (!ehFimDeSemana(atual) && !ehFeriado(atual, cacheFeriados)) {
      restantes -= 1;
    }
  }

  return atual;
}

export function diasRestantes(dataFinal: Date, referencia: Date = new Date()): number {
  const inicio = Date.UTC(
    referencia.getUTCFullYear(),
    referencia.getUTCMonth(),
    referencia.getUTCDate()
  );
  const fim = Date.UTC(
    dataFinal.getUTCFullYear(),
    dataFinal.getUTCMonth(),
    dataFinal.getUTCDate()
  );
  return Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
}

export function prazoProximoDoVencimento(dataFinal: Date, referencia: Date = new Date()): boolean {
  const restantes = diasRestantes(dataFinal, referencia);
  return restantes <= 7;
}
