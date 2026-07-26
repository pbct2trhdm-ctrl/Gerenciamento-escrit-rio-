"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import type { Prisma } from "@/app/generated/prisma/client";

const TIPOS = ["PETICAO", "RECURSO", "AUDIENCIA", "MANIFESTACAO", "OUTRO"] as const;
const STATUS = ["PENDENTE", "CUMPRIDO", "PERDIDO"] as const;
const MODALIDADES_AUDIENCIA = ["VIRTUAL", "HIBRIDA", "PRESENCIAL"] as const;

function validarTipo(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (TIPOS as readonly string[]).includes(texto)
    ? (texto as (typeof TIPOS)[number])
    : "OUTRO";
}

function validarStatus(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (STATUS as readonly string[]).includes(texto)
    ? (texto as (typeof STATUS)[number])
    : "PENDENTE";
}

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function parseDataHorario(dataValor: FormDataEntryValue | null, horaValor: FormDataEntryValue | null): Date {
  const textoData = (dataValor ?? "").toString();
  const [ano, mes, dia] = textoData.split("-").map(Number);
  const textoHora = (horaValor ?? "").toString();
  const [hora, minuto] = textoHora.split(":").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1, hora || 0, minuto || 0));
}

function validarModalidadeAudiencia(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (MODALIDADES_AUDIENCIA as readonly string[]).includes(texto)
    ? (texto as (typeof MODALIDADES_AUDIENCIA)[number])
    : null;
}

function parseDiasAntecedencia(valor: FormDataEntryValue | null): number | null {
  const texto = (valor ?? "").toString().trim();
  if (texto === "") return null;
  const numero = Number(texto);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

/**
 * Audiência não tem contagem em dias úteis/corridos: a data final é a
 * própria data e hora marcadas, sem cálculo de prazo. Também carrega a
 * modalidade e, quando virtual/híbrida, o link e o contato da vara.
 */
function montarDadosPrazo(
  tipo: (typeof TIPOS)[number],
  formData: FormData
): Pick<
  Prisma.PrazoUncheckedCreateInput,
  | "dataBase"
  | "dias"
  | "contagem"
  | "dataFinal"
  | "modalidadeAudiencia"
  | "linkAudiencia"
  | "contatoVaraAudiencia"
> {
  if (tipo === "AUDIENCIA") {
    const dataFinal = parseDataHorario(
      formData.get("dataAudiencia"),
      formData.get("horaAudiencia")
    );
    const modalidadeAudiencia = validarModalidadeAudiencia(formData.get("modalidadeAudiencia"));
    const precisaDeLink = modalidadeAudiencia === "VIRTUAL" || modalidadeAudiencia === "HIBRIDA";
    return {
      dataBase: null,
      dias: null,
      contagem: null,
      dataFinal,
      modalidadeAudiencia,
      linkAudiencia: precisaDeLink ? textoOuNull(formData.get("linkAudiencia")) : null,
      contatoVaraAudiencia: precisaDeLink
        ? textoOuNull(formData.get("contatoVaraAudiencia"))
        : null,
    };
  }

  const dataBase = parseData(formData.get("dataBase"));
  const dias = Number(formData.get("dias") ?? 0);
  const contagem: TipoContagem =
    formData.get("contagem") === "DIAS_CORRIDOS" ? "DIAS_CORRIDOS" : "DIAS_UTEIS";
  const dataFinal = calcularDataFinal(dataBase, dias, contagem);
  return {
    dataBase,
    dias,
    contagem,
    dataFinal,
    modalidadeAudiencia: null,
    linkAudiencia: null,
    contatoVaraAudiencia: null,
  };
}

export async function criarPrazo(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  const tipo = validarTipo(formData.get("tipo"));

  await prisma.prazo.create({
    data: {
      processoId,
      tipo,
      ...montarDadosPrazo(tipo, formData),
      diasAntecedenciaNotificacao: parseDiasAntecedencia(
        formData.get("diasAntecedenciaNotificacao")
      ),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/prazos");
  revalidatePath("/");
  revalidatePath(`/processos/${processoId}`);
  redirect(`/processos/${processoId}`);
}

export async function atualizarPrazo(id: string, formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  const tipo = validarTipo(formData.get("tipo"));

  await prisma.prazo.update({
    where: { id },
    data: {
      processoId,
      tipo,
      ...montarDadosPrazo(tipo, formData),
      diasAntecedenciaNotificacao: parseDiasAntecedencia(
        formData.get("diasAntecedenciaNotificacao")
      ),
      status: validarStatus(formData.get("status")),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/prazos");
  revalidatePath("/");
  revalidatePath(`/processos/${processoId}`);
  redirect(`/processos/${processoId}`);
}

export async function excluirPrazo(id: string) {
  const prazo = await prisma.prazo.delete({ where: { id } });
  revalidatePath("/prazos");
  revalidatePath("/");
  revalidatePath(`/processos/${prazo.processoId}`);
  redirect(`/processos/${prazo.processoId}`);
}

export async function marcarPrazoComoCumprido(id: string) {
  await prisma.prazo.update({
    where: { id },
    data: { status: "CUMPRIDO" },
  });
  revalidatePath("/prazos");
  revalidatePath("/");
}
