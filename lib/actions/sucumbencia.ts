"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const STATUS = ["AGUARDANDO_DECISAO", "DEFINIDO", "EM_EXECUCAO", "RECEBIDO"] as const;
const FORMAS = ["RPV", "PRECATORIO", "DEPOSITO_DIRETO", "OUTRO"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function numeroOuNull(valor: FormDataEntryValue | null): number | null {
  const texto = (valor ?? "").toString().trim();
  if (texto === "") return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function parseData(valor: FormDataEntryValue | null): Date | null {
  const texto = (valor ?? "").toString();
  if (!texto) return null;
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function validarStatus(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (STATUS as readonly string[]).includes(texto)
    ? (texto as (typeof STATUS)[number])
    : "AGUARDANDO_DECISAO";
}

function validarForma(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (FORMAS as readonly string[]).includes(texto)
    ? (texto as (typeof FORMAS)[number])
    : null;
}

function dadosComuns(formData: FormData) {
  return {
    valorEstimado: numeroOuNull(formData.get("valorEstimado")),
    valorDefinido: numeroOuNull(formData.get("valorDefinido")),
    percentual: numeroOuNull(formData.get("percentual")),
    status: validarStatus(formData.get("status")),
    formaRecebimento: validarForma(formData.get("formaRecebimento")),
    dataTransitoJulgado: parseData(formData.get("dataTransitoJulgado")),
    dataRecebimento: parseData(formData.get("dataRecebimento")),
    notaFiscalEmitida: formData.get("notaFiscalEmitida") === "on",
    dataEmissaoNf: parseData(formData.get("dataEmissaoNf")),
    observacoes: textoOuNull(formData.get("observacoes")),
  };
}

export async function criarSucumbencia(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  const sucumbencia = await prisma.honorarioSucumbencial.create({
    data: { processoId, ...dadosComuns(formData) },
  });

  revalidatePath("/financeiro/sucumbencia");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${processoId}`);
  redirect(`/financeiro/sucumbencia/${sucumbencia.id}/editar`);
}

export async function atualizarSucumbencia(id: string, formData: FormData) {
  const sucumbencia = await prisma.honorarioSucumbencial.update({
    where: { id },
    data: dadosComuns(formData),
  });

  revalidatePath("/financeiro/sucumbencia");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${sucumbencia.processoId}`);
  redirect("/financeiro/sucumbencia");
}

export async function excluirSucumbencia(id: string) {
  const sucumbencia = await prisma.honorarioSucumbencial.delete({
    where: { id },
  });
  revalidatePath("/financeiro/sucumbencia");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${sucumbencia.processoId}`);
  redirect("/financeiro/sucumbencia");
}
