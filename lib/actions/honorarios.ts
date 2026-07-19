"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const TIPOS = ["FIXO", "PARCELADO", "EXITO", "MENSALIDADE"] as const;
const STATUS_PARCELA = ["PENDENTE", "PAGO"] as const;

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

function validarTipo(valor: FormDataEntryValue | null) {
  const texto = (valor ?? "").toString();
  return (TIPOS as readonly string[]).includes(texto)
    ? (texto as (typeof TIPOS)[number])
    : "FIXO";
}

export async function criarHonorario(formData: FormData) {
  const processoId = (formData.get("processoId") ?? "").toString();
  if (!processoId) {
    throw new Error("Processo é obrigatório");
  }

  const dataContrato = parseData(formData.get("dataContrato")) ?? new Date();

  const honorario = await prisma.honorario.create({
    data: {
      processoId,
      tipo: validarTipo(formData.get("tipo")),
      valorTotal: numeroOuNull(formData.get("valorTotal")),
      percentualExito: numeroOuNull(formData.get("percentualExito")),
      dataContrato,
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/financeiro/honorarios");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${processoId}`);
  redirect(`/financeiro/honorarios/${honorario.id}`);
}

export async function atualizarHonorario(id: string, formData: FormData) {
  const dataContrato = parseData(formData.get("dataContrato")) ?? new Date();

  const honorario = await prisma.honorario.update({
    where: { id },
    data: {
      tipo: validarTipo(formData.get("tipo")),
      valorTotal: numeroOuNull(formData.get("valorTotal")),
      percentualExito: numeroOuNull(formData.get("percentualExito")),
      dataContrato,
      observacoes: textoOuNull(formData.get("observacoes")),
    },
  });

  revalidatePath("/financeiro/honorarios");
  revalidatePath(`/financeiro/honorarios/${id}`);
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${honorario.processoId}`);
  redirect(`/financeiro/honorarios/${id}`);
}

export async function excluirHonorario(id: string) {
  const honorario = await prisma.honorario.delete({ where: { id } });
  revalidatePath("/financeiro/honorarios");
  revalidatePath("/financeiro");
  revalidatePath(`/processos/${honorario.processoId}`);
  redirect("/financeiro/honorarios");
}

export async function criarParcela(honorarioId: string, formData: FormData) {
  const vencimento = parseData(formData.get("vencimento"));
  if (!vencimento) {
    throw new Error("Vencimento é obrigatório");
  }

  await prisma.parcela.create({
    data: {
      honorarioId,
      numero: Number(formData.get("numero") ?? 1),
      valor: Number(formData.get("valor") ?? 0),
      vencimento,
    },
  });

  revalidatePath(`/financeiro/honorarios/${honorarioId}`);
  revalidatePath("/financeiro");
  redirect(`/financeiro/honorarios/${honorarioId}`);
}

export async function atualizarParcela(
  id: string,
  honorarioId: string,
  formData: FormData
) {
  const vencimento = parseData(formData.get("vencimento"));
  if (!vencimento) {
    throw new Error("Vencimento é obrigatório");
  }

  const status = (formData.get("status") ?? "PENDENTE").toString();

  await prisma.parcela.update({
    where: { id },
    data: {
      numero: Number(formData.get("numero") ?? 1),
      valor: Number(formData.get("valor") ?? 0),
      vencimento,
      status: (STATUS_PARCELA as readonly string[]).includes(status)
        ? (status as (typeof STATUS_PARCELA)[number])
        : "PENDENTE",
      dataPagamento: parseData(formData.get("dataPagamento")),
      notaFiscalEmitida: formData.get("notaFiscalEmitida") === "on",
      dataEmissaoNf: parseData(formData.get("dataEmissaoNf")),
    },
  });

  revalidatePath(`/financeiro/honorarios/${honorarioId}`);
  revalidatePath("/financeiro");
  redirect(`/financeiro/honorarios/${honorarioId}`);
}

export async function excluirParcela(id: string, honorarioId: string) {
  await prisma.parcela.delete({ where: { id } });
  revalidatePath(`/financeiro/honorarios/${honorarioId}`);
  revalidatePath("/financeiro");
  redirect(`/financeiro/honorarios/${honorarioId}`);
}

export async function marcarParcelaPaga(id: string) {
  const parcela = await prisma.parcela.findUniqueOrThrow({ where: { id } });
  await prisma.parcela.update({
    where: { id },
    data: {
      status: "PAGO",
      dataPagamento: parcela.dataPagamento ?? new Date(),
    },
  });
  revalidatePath(`/financeiro/honorarios/${parcela.honorarioId}`);
  revalidatePath("/financeiro/honorarios");
  revalidatePath("/financeiro");
}

export async function marcarNotaFiscalParcela(id: string) {
  const parcela = await prisma.parcela.findUniqueOrThrow({ where: { id } });
  await prisma.parcela.update({
    where: { id },
    data: {
      notaFiscalEmitida: true,
      dataEmissaoNf: parcela.dataEmissaoNf ?? new Date(),
    },
  });
  revalidatePath(`/financeiro/honorarios/${parcela.honorarioId}`);
  revalidatePath("/financeiro/honorarios");
  revalidatePath("/financeiro");
}
