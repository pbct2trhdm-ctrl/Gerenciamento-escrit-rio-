"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const AREAS = ["CIVEL", "PREVIDENCIARIO", "TRIBUTARIO", "OUTRO"] as const;
const STATUS = ["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function validarArea(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (AREAS as readonly string[]).includes(texto)
    ? (texto as (typeof AREAS)[number])
    : "OUTRO";
}

function validarStatus(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (STATUS as readonly string[]).includes(texto)
    ? (texto as (typeof STATUS)[number])
    : "ATIVO";
}

export async function criarProcesso(formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  const processo = await prisma.processo.create({
    data: {
      clienteId,
      numeroProcesso: textoOuNull(formData.get("numeroProcesso")),
      area: validarArea(formData.get("area")),
      vara: textoOuNull(formData.get("vara")),
      comarca: textoOuNull(formData.get("comarca")),
      status: validarStatus(formData.get("status")),
      resumo: textoOuNull(formData.get("resumo")),
    },
  });

  revalidatePath("/processos");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/processos/${processo.id}`);
}

export async function atualizarProcesso(id: string, formData: FormData) {
  const clienteId = (formData.get("clienteId") ?? "").toString();
  if (!clienteId) {
    throw new Error("Cliente é obrigatório");
  }

  await prisma.processo.update({
    where: { id },
    data: {
      clienteId,
      numeroProcesso: textoOuNull(formData.get("numeroProcesso")),
      area: validarArea(formData.get("area")),
      vara: textoOuNull(formData.get("vara")),
      comarca: textoOuNull(formData.get("comarca")),
      status: validarStatus(formData.get("status")),
      resumo: textoOuNull(formData.get("resumo")),
    },
  });

  revalidatePath("/processos");
  revalidatePath(`/processos/${id}`);
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/processos/${id}`);
}

export async function excluirProcesso(id: string) {
  const processo = await prisma.processo.delete({ where: { id } });
  revalidatePath("/processos");
  revalidatePath(`/clientes/${processo.clienteId}`);
  redirect(`/clientes/${processo.clienteId}`);
}
