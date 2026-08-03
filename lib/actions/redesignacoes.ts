"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatarDataHorario } from "@/lib/formatacao";

function parseDataHorario(
  dataValor: FormDataEntryValue | null,
  horaValor: FormDataEntryValue | null
): Date {
  const textoData = (dataValor ?? "").toString();
  const [ano, mes, dia] = textoData.split("-").map(Number);
  const textoHora = (horaValor ?? "").toString();
  const [hora, minuto] = textoHora.split(":").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1, hora || 0, minuto || 0));
}

function hojeData(): Date {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
}

export async function criarRedesignacao(prazoId: string, formData: FormData) {
  const prazo = await prisma.prazo.findUnique({ where: { id: prazoId } });
  if (!prazo) {
    throw new Error("Prazo não encontrado");
  }
  if (prazo.tipo !== "AUDIENCIA") {
    throw new Error("Só é possível redesignar prazos do tipo audiência");
  }

  const dataNova = parseDataHorario(formData.get("dataNova"), formData.get("horaNova"));
  const motivo = (formData.get("motivo") ?? "").toString().trim();
  if (!motivo) {
    throw new Error("Motivo é obrigatório");
  }

  const dataAnterior = prazo.dataFinal;

  await prisma.redesignacao.create({
    data: { prazoId, dataAnterior, dataNova, motivo },
  });

  await prisma.prazo.update({
    where: { id: prazoId },
    data: { dataFinal: dataNova, status: "PENDENTE" },
  });

  await prisma.andamento.create({
    data: {
      processoId: prazo.processoId,
      data: hojeData(),
      tipo: "REDESIGNACAO_AUDIENCIA",
      descricao: `Audiência redesignada de ${formatarDataHorario(dataAnterior)} para ${formatarDataHorario(dataNova)}. Motivo: ${motivo}`,
    },
  });

  revalidatePath("/prazos");
  revalidatePath("/");
  revalidatePath(`/processos/${prazo.processoId}`);
  revalidatePath(`/prazos/${prazoId}`);
  redirect(`/prazos/${prazoId}`);
}
