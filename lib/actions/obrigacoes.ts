"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { competenciaDeString } from "@/lib/financeiro";

const TIPOS = ["PRO_LABORE", "DAS", "INSS_SOCIO", "CPP_PATRONAL"] as const;

function parseData(valor: FormDataEntryValue | null): Date | null {
  const texto = (valor ?? "").toString();
  if (!texto) return null;
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes || 1) - 1, dia || 1));
}

export async function salvarObrigacoesDaCompetencia(formData: FormData) {
  const competenciaTexto = (formData.get("competencia") ?? "").toString();
  const competencia = competenciaDeString(competenciaTexto);

  for (const tipo of TIPOS) {
    const valorTexto = (formData.get(`valor_${tipo}`) ?? "").toString().trim();
    if (valorTexto === "") continue;
    const valor = Number(valorTexto);
    const status = formData.get(`status_${tipo}`) === "PAGO" ? "PAGO" : "PENDENTE";
    const dataPagamento = parseData(formData.get(`dataPagamento_${tipo}`));

    await prisma.obrigacaoSocietaria.upsert({
      where: { competencia_tipo: { competencia, tipo } },
      create: { competencia, tipo, valor, status, dataPagamento },
      update: { valor, status, dataPagamento },
    });
  }

  revalidatePath("/financeiro/obrigacoes");
  revalidatePath("/financeiro");
  redirect(`/financeiro/obrigacoes?competencia=${competenciaTexto}`);
}

export async function criarRetirada(formData: FormData) {
  const dataTexto = (formData.get("data") ?? "").toString();
  const data = parseData(formData.get("data")) ?? new Date();
  const competenciaTexto = dataTexto.slice(0, 7);

  await prisma.retiradaLucro.create({
    data: {
      data,
      valor: Number(formData.get("valor") ?? 0),
      observacoes: (formData.get("observacoes") ?? "").toString().trim() || null,
    },
  });

  revalidatePath("/financeiro/obrigacoes");
  revalidatePath("/financeiro");
  redirect(`/financeiro/obrigacoes?competencia=${competenciaTexto}`);
}

export async function excluirRetirada(id: string, competenciaTexto: string) {
  await prisma.retiradaLucro.delete({ where: { id } });
  revalidatePath("/financeiro/obrigacoes");
  revalidatePath("/financeiro");
  redirect(`/financeiro/obrigacoes?competencia=${competenciaTexto}`);
}
