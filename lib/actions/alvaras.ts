"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const STATUS = ["AGUARDANDO_REPASSE", "REPASSADO"] as const;

function textoOuNull(valor: FormDataEntryValue | null): string | null {
  const texto = (valor ?? "").toString().trim();
  return texto === "" ? null : texto;
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
    : "AGUARDANDO_REPASSE";
}

function dadosComuns(formData: FormData) {
  const valorTotal = Number(formData.get("valorTotal") ?? 0);
  const valorRetido = Number(formData.get("valorRetido") ?? 0);
  const valorRepassadoTexto = (formData.get("valorRepassado") ?? "").toString().trim();
  const valorRepassado =
    valorRepassadoTexto === ""
      ? valorTotal - valorRetido
      : Number(valorRepassadoTexto);

  const honorarioSucumbencialId = (formData.get("honorarioSucumbencialId") ?? "").toString();

  return {
    honorarioSucumbencialId: honorarioSucumbencialId || null,
    valorTotal,
    valorRetido,
    valorRepassado,
    dataRecebimento: parseData(formData.get("dataRecebimento")),
    dataRepasse: parseData(formData.get("dataRepasse")),
    status: validarStatus(formData.get("status")),
    bancoDestino: textoOuNull(formData.get("bancoDestino")),
    agenciaDestino: textoOuNull(formData.get("agenciaDestino")),
    contaDestino: textoOuNull(formData.get("contaDestino")),
    chavePixDestino: textoOuNull(formData.get("chavePixDestino")),
    observacoes: textoOuNull(formData.get("observacoes")),
  };
}

export async function criarAlvara(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  await prisma.alvara.create({
    data: { processoId, ...dadosComuns(formData) },
  });

  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${processoId}`);
  redirect("/financeiro/alvaras");
}

export async function atualizarAlvara(id: string, formData: FormData) {
  const alvara = await prisma.alvara.update({
    where: { id },
    data: dadosComuns(formData),
  });

  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${alvara.processoId}`);
  redirect("/financeiro/alvaras");
}

export async function excluirAlvara(id: string) {
  const alvara = await prisma.alvara.delete({ where: { id } });
  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${alvara.processoId}`);
  redirect("/financeiro/alvaras");
}

export async function marcarAlvaraRepassado(id: string) {
  const alvara = await prisma.alvara.findUniqueOrThrow({ where: { id } });
  await prisma.alvara.update({
    where: { id },
    data: {
      status: "REPASSADO",
      dataRepasse: alvara.dataRepasse ?? new Date(),
    },
  });
  revalidatePath("/financeiro/alvaras");
  revalidatePath("/financeiro");
}
