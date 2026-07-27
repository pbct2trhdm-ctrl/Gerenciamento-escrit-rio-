"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TODOS_TRIBUNAIS } from "@/lib/tribunais";
import { TIPOS_RECURSO } from "@/lib/formatacao";
import type { Tribunal } from "@/app/generated/prisma/client";

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
}

function parseData(valor: FormDataEntryValue | null): Date {
  const texto = (valor ?? "").toString();
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

function validarTipoRecurso(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (TIPOS_RECURSO as readonly string[]).includes(texto)
    ? (texto as (typeof TIPOS_RECURSO)[number])
    : "OUTRO";
}

function validarTribunal(valor: FormDataEntryValue | null): Tribunal | null {
  const texto = (valor ?? "").toString();
  return TODOS_TRIBUNAIS.includes(texto) ? (texto as Tribunal) : null;
}

export async function criarRecurso(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  await prisma.recurso.create({
    data: {
      processoId,
      tipoRecurso: validarTipoRecurso(formData.get("tipoRecurso")),
      dataInterposicao: parseData(formData.get("dataInterposicao")),
      tribunal2Grau: validarTribunal(formData.get("tribunal2Grau")),
      orgaoJulgador: textoOuNull(formData.get("orgaoJulgador")),
      relator: textoOuNull(formData.get("relator")),
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath(`/processos/${processoId}`);
  redirect(`/processos/${processoId}`);
}

export async function excluirRecurso(id: string) {
  const recurso = await prisma.recurso.delete({ where: { id } });
  revalidatePath(`/processos/${recurso.processoId}`);
  redirect(`/processos/${recurso.processoId}`);
}
