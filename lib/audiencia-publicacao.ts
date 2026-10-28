import { prisma } from "@/lib/prisma";
import { normalizarTexto } from "@/lib/prazo-publicacao";
import { formatarData, formatarDataHorario } from "@/lib/formatacao";
import type { ModalidadeAudiencia } from "@/app/generated/prisma/client";

/**
 * Captação de audiências nas publicações do DJEN: procura, perto da palavra
 * "audiência", uma data futura (e o horário, se houver), a modalidade e o
 * link da sala virtual. A audiência entra em Prazos/Agenda vinculada ao
 * processo, com o selo "A conferir". Datas passadas (ex.: "audiência
 * realizada em…") são ignoradas; se houver mais de uma data futura possível,
 * nada é criado — melhor a advogada cadastrar do que o sistema escolher errado.
 *
 * Convenção do sistema: a data/hora da audiência é gravada em UTC com o
 * horário "de parede" (09:00 → 09:00Z), como no formulário de prazos.
 */

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

export type AudienciaIdentificada = {
  data: Date;
  horarioIdentificado: boolean;
  modalidade: ModalidadeAudiencia | null;
  link: string | null;
  redesignacao: boolean;
};

const JANELA_APOS_AUDIENCIA = 320;

function dataValida(ano: number, mes: number, dia: number): boolean {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Todas as datas válidas (com o horário logo após cada uma) num trecho normalizado, em ordem. */
function datasNoTrecho(trecho: string): { data: Date; horario: boolean }[] {
  const numerica = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/g;
  const extenso = new RegExp(`(\\d{1,2})(?:º|°|o)? de (${Object.keys(MESES).join("|")}) de (\\d{4})`, "g");

  const encontrados = [
    ...[...trecho.matchAll(numerica)].map((m) => ({ m, dia: Number(m[1]), mes: Number(m[2]), ano: Number(m[3]) })),
    ...[...trecho.matchAll(extenso)].map((m) => ({ m, dia: Number(m[1]), mes: MESES[m[2]], ano: Number(m[3]) })),
  ].sort((x, y) => x.m.index - y.m.index);

  const resultado: { data: Date; horario: boolean }[] = [];
  for (const { m, dia, mes, ano } of encontrados) {
    // Descarta trechos que só parecem data (ex.: "45.2026" do número do processo).
    if (!dataValida(ano, mes, dia)) continue;
    const fim = m.index + m[0].length;
    const depois = trecho.slice(fim, fim + 40);
    const hora = /^[\s,]*(?:as|a partir das|pelas|horario:?)?\s*(\d{1,2})\s*(?:h|:|horas?)\s*(\d{2})?/.exec(depois);
    let horas = 0;
    let minutos = 0;
    let horario = false;
    if (hora) {
      const h = Number(hora[1]);
      const min = hora[2] ? Number(hora[2]) : 0;
      if (h <= 23 && min <= 59) {
        horas = h;
        minutos = min;
        horario = true;
      }
    }
    resultado.push({ data: new Date(Date.UTC(ano, mes - 1, dia, horas, minutos)), horario });
  }
  return resultado;
}

function identificarModalidade(texto: string): ModalidadeAudiencia | null {
  if (/hibrid|semipresencial/.test(texto)) return "HIBRIDA";
  if (/videoconferencia|telepresencial|virtual|por video|microsoft teams|zoom|google meet|plataforma|link de acesso|sala virtual|balcao virtual/.test(texto)) {
    return "VIRTUAL";
  }
  if (/presencial/.test(texto)) return "PRESENCIAL";
  return null;
}

function identificarLink(textoOriginal: string): string | null {
  const links = textoOriginal.match(/https?:\/\/[^\s"'<>)\]]+/g) ?? [];
  const sala = links.find((l) => /teams|zoom|meet\.|webex|jitsi|whereby|videoconf|cisco/i.test(l));
  return sala ? sala.replace(/[.,;:]+$/, "") : null;
}

/**
 * Lê a audiência do texto. `referencia` é a data a partir da qual a audiência
 * precisa estar (hoje): datas anteriores são ignoradas.
 */
export function identificarAudienciaNoTexto(
  textoOriginal: string,
  referencia: Date
): AudienciaIdentificada | null {
  const texto = normalizarTexto(textoOriginal);
  if (!texto.includes("audiencia")) return null;

  const inicioReferencia = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const redesignacao = /redesign|remarc|adiad|nova data/.test(texto);
  const futura = (d: { data: Date }) => d.data.getTime() >= inicioReferencia;

  const candidatas: { data: Date; horario: boolean }[] = [];
  const indicesRedesignacao = [...texto.matchAll(/redesign|remarc|adiad|nova data/g)].map((m) => m.index);
  if (redesignacao) {
    // "Redesigno a audiência marcada para X para o dia Y": a nova data é a
    // última mencionada logo após o termo de redesignação.
    for (const indice of indicesRedesignacao) {
      const datas = datasNoTrecho(texto.slice(indice, indice + JANELA_APOS_AUDIENCIA)).filter(futura);
      if (datas.length > 0) candidatas.push(datas[datas.length - 1]);
    }
  }
  if (candidatas.length === 0) {
    for (const match of texto.matchAll(/audiencia/g)) {
      const primeira = datasNoTrecho(texto.slice(match.index, match.index + JANELA_APOS_AUDIENCIA))[0];
      if (primeira && futura(primeira)) candidatas.push(primeira);
    }
  }

  // Mesma data com e sem horário conta como uma só (prevalece a com horário).
  const porDia = new Map<string, { data: Date; horario: boolean }>();
  for (const c of candidatas) {
    const dia = c.data.toISOString().slice(0, 10);
    const atual = porDia.get(dia);
    if (!atual || (c.horario && !atual.horario)) porDia.set(dia, c);
  }
  if (porDia.size !== 1) return null;
  const [unica] = porDia.values();

  return {
    data: unica.data,
    horarioIdentificado: unica.horario,
    modalidade: identificarModalidade(texto),
    link: identificarLink(textoOriginal),
    redesignacao,
  };
}

export type ResultadoAudiencia = "criada" | "redesignada" | "existente" | "nenhuma";

/**
 * Cria (ou redesigna) a audiência do processo a partir da publicação já
 * vinculada. Idempotente: não duplica audiência na mesma data/hora.
 */
export async function gerarAudienciaDaPublicacao(
  publicacaoId: string,
  origemAndamentoId: string | null,
  agora: Date = new Date()
): Promise<ResultadoAudiencia> {
  const publicacao = await prisma.publicacao.findUnique({ where: { id: publicacaoId } });
  if (!publicacao?.processoId) return "nenhuma";

  const audiencia = identificarAudienciaNoTexto(publicacao.textoPublicacao, agora);
  if (!audiencia) return "nenhuma";

  // Já processada (audiência criada a partir desta publicação) ou data que já
  // foi substituída por uma redesignação: não recria.
  const jaProcessada = await prisma.prazo.count({
    where: { origemPublicacaoId: publicacao.id, tipo: "AUDIENCIA" },
  });
  const dataRedesignada = await prisma.redesignacao.count({
    where: { dataAnterior: audiencia.data, prazo: { processoId: publicacao.processoId } },
  });
  if (jaProcessada > 0 || dataRedesignada > 0) return "existente";

  const pendentes = await prisma.prazo.findMany({
    where: { processoId: publicacao.processoId, tipo: "AUDIENCIA", status: "PENDENTE" },
  });
  if (pendentes.some((p) => p.dataFinal.getTime() === audiencia.data.getTime())) {
    return "existente";
  }
  const mesmoDia = (d: Date) => d.toISOString().slice(0, 10) === audiencia.data.toISOString().slice(0, 10);
  if (!audiencia.horarioIdentificado && pendentes.some((p) => mesmoDia(p.dataFinal))) {
    return "existente";
  }

  const disponibilizacao = formatarData(publicacao.dataPublicacao);
  const avisoHorario = audiencia.horarioIdentificado ? "" : " Horário não identificado no texto — informe o horário.";

  // Redesignação: com uma única audiência pendente no processo, move a data
  // dela (com histórico) em vez de criar outra.
  if (audiencia.redesignacao && pendentes.length === 1) {
    const prazo = pendentes[0];
    await prisma.redesignacao.create({
      data: {
        prazoId: prazo.id,
        dataAnterior: prazo.dataFinal,
        dataNova: audiencia.data,
        motivo: `Redesignada conforme publicação do DJEN de ${disponibilizacao}.`,
      },
    });
    await prisma.prazo.update({
      where: { id: prazo.id },
      data: {
        dataFinal: audiencia.data,
        aConferir: true,
        modalidadeAudiencia: audiencia.modalidade ?? prazo.modalidadeAudiencia,
        linkAudiencia: audiencia.link ?? prazo.linkAudiencia,
      },
    });
    await prisma.andamento.create({
      data: {
        processoId: publicacao.processoId,
        data: publicacao.dataPublicacao,
        tipo: "REDESIGNACAO_AUDIENCIA",
        descricao: `Audiência redesignada de ${formatarDataHorario(prazo.dataFinal)} para ${formatarDataHorario(audiencia.data)}, conforme publicação do DJEN de ${disponibilizacao}.${avisoHorario}`,
      },
    });
    return "redesignada";
  }

  await prisma.prazo.create({
    data: {
      processoId: publicacao.processoId,
      tipo: "AUDIENCIA",
      dataFinal: audiencia.data,
      modalidadeAudiencia: audiencia.modalidade,
      linkAudiencia: audiencia.link,
      aConferir: true,
      origemPublicacaoId: publicacao.id,
      origemAndamentoId,
      observacoes: `Audiência captada da publicação do DJEN de ${disponibilizacao}. Confira data, horário e modalidade.${avisoHorario}`,
    },
  });
  return "criada";
}
