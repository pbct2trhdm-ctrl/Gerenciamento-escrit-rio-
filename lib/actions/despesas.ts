"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const CATEGORIAS = ["CUSTAS", "ALUGUEL", "MATERIAL", "OUTRO"] as const;

function validarCategoria(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (CATEGORIAS as readonly string[]).includes(texto)
    ? (texto as (typeof CATEGORIAS)[number])
    : "OUTRO";
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano || new Date().getUTCFullYear(), (mes || 1) - 1, dia || 1));
}

function dadosComuns(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  return {
    descricao: (formData.get("descricao") ?? "").toString().trim(),
    categoria: validarCategoria(formData.get("categoria")),
    valor: Number(formData.get("valor") ?? 0),
    data: parseData(formData.get("data")),
    processoId: processoId || null,
  };
}

export async function criarDespesa(formData: FormData) {
  await prisma.despesa.create({ data: dadosComuns(formData) });
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro");
  redirect("/financeiro/despesas");
}

export async function atualizarDespesa(id: string, formData: FormData) {
  await prisma.despesa.update({ where: { id }, data: dadosComuns(formData) });
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro");
  redirect("/financeiro/despesas");
}

export async function excluirDespesa(id: string) {
  await prisma.despesa.delete({ where: { id } });
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro");
  redirect("/financeiro/despesas");
}
